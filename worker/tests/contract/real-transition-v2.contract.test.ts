import { beforeEach, describe, expect, it } from "vitest";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { RealCredentialReferenceRepository } from "../../src/airtable/RealCredentialReferenceRepository";
import { UserRepository } from "../../src/airtable/UserRepository";
import type { UserFields } from "../../src/airtable/userSchema";
import { noOpAuditSink } from "../../src/audit/AuditSink";
import { issueSessionToken } from "../../src/auth/sessionToken";
import { createRequestContext } from "../../src/http/requestContext";
import { realCredentialsRoute } from "../../src/routes/v2/credentials";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { createAirtableFetch } from "../support/createAirtableFetch";
import { RealCredentialProviderStub } from "../support/RealCredentialProviderStub";
import { SecureDeliveryStub } from "../support/SecureDeliveryStub";

const signingKey = "transition-signing-key-with-at-least-32-characters";
const now = "2026-08-15T12:00:00.000Z";

describe("POST real transition v2", () => {
  let dependencies: Parameters<typeof realCredentialsRoute>[2];
  let authorization: string;
  let referenceId: string;
  let sequence: number;

  beforeEach(async () => {
    sequence = 0;
    const user: UserFields = {
      userId: "transition-user",
      loginIdentifier: "transition@example.invalid",
      displayName: "Transition User",
      profile: "senior_analyst",
      enabled: true,
      permissions: [
        "applications:read",
        "credentials:issue",
        "credentials:suspend",
        "credentials:reactivate",
        "credentials:revoke",
      ],
    };
    const store = new InMemoryCredentialStore({
      Users: [user],
      RealCredentialReferences: [],
      RealOperationReceipts: [],
    });
    const airtable = new AirtableClient({
      baseId: "app00000000000000",
      token: "test-token-value",
      fetcher: createAirtableFetch(store),
    });
    authorization = `Bearer ${(await issueSessionToken(user.userId, signingKey)).token}`;
    const references = new RealCredentialReferenceRepository(airtable);
    dependencies = {
      users: new UserRepository(airtable),
      audit: noOpAuditSink,
      signingKey,
      real: {
        provider: new RealCredentialProviderStub(),
        delivery: new SecureDeliveryStub(() => new Date(now).getTime()),
        references,
        allowedEnvironments: new Set(["test"]),
        now: () => now,
        operationId: () => `contract-transition-${++sequence}`,
      },
    };
    const issue = request(
      "/v2/applications/app-transition/credentials?environment=test",
      "contract-transition-issue",
    );
    await realCredentialsRoute(
      issue,
      createRequestContext(issue),
      dependencies,
    );
    referenceId = (await references.listReferences())[0]!.referenceId;
  });

  it("requires a reason and returns a safe confirmed transition receipt", async () => {
    const path = `/v2/applications/app-transition/credentials/${encodeURIComponent(referenceId)}/transitions?environment=test`;
    const suspend = request(path, "contract-suspend-key-01", {
      action: "suspend",
      reason: "Incidencia operativa",
    });
    const response = await realCredentialsRoute(
      suspend,
      createRequestContext(suspend),
      dependencies,
    );

    expect(response?.status).toBe(200);
    await expect(response!.json()).resolves.toMatchObject({
      contractVersion: "2",
      status: "confirmed",
      result: "succeeded",
    });

    const invalid = request(path, "contract-suspend-key-02", {
      action: "suspend",
      reason: "",
    });
    await expect(
      realCredentialsRoute(
        invalid,
        createRequestContext(invalid),
        dependencies,
      ),
    ).rejects.toMatchObject({ code: "invalid_transition", status: 400 });
  });

  function request(path: string, key: string, body?: unknown) {
    return new Request(`https://keyops.test${path}`, {
      method: "POST",
      headers: {
        authorization,
        "idempotency-key": key,
        ...(body ? { "content-type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }
});
