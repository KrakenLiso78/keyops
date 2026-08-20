import { beforeEach, describe, expect, it } from "vitest";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { RealCredentialReferenceRepository } from "../../src/airtable/RealCredentialReferenceRepository";
import { UserRepository } from "../../src/airtable/UserRepository";
import { ComplianceAuditRecorder } from "../../src/audit/AuditRecorder";
import { issueSessionToken } from "../../src/auth/sessionToken";
import { createRequestContext } from "../../src/http/requestContext";
import { realCredentialsRoute } from "../../src/routes/v2/credentials";
import type { UserFields } from "../../src/airtable/userSchema";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { createAirtableFetch } from "../support/createAirtableFetch";
import { RealCredentialProviderStub } from "../support/RealCredentialProviderStub";
import { SecureDeliveryStub } from "../support/SecureDeliveryStub";
import { ComplianceAuditStub } from "../support/ComplianceAuditStub";

const signingKey = "contract-signing-key-with-at-least-32-characters";
const now = "2026-08-15T12:00:00.000Z";
const user: UserFields = {
  userId: "real-operator",
  loginIdentifier: "real-operator@example.invalid",
  displayName: "Operador Real",
  profile: "senior_analyst",
  enabled: true,
  permissions: [
    "applications:read",
    "credentials:issue",
    "credentials:regenerate",
    "credentials:suspend",
    "credentials:reactivate",
    "credentials:revoke",
  ],
};

describe("KeyOps real credentials API v2", () => {
  let store: InMemoryCredentialStore;
  let dependencies: Parameters<typeof realCredentialsRoute>[2];
  let authorization: string;
  let references: RealCredentialReferenceRepository;
  let compliance: ComplianceAuditStub;
  let sequence: number;

  beforeEach(async () => {
    sequence = 0;
    store = new InMemoryCredentialStore({
      Users: [user],
      RealCredentialReferences: [],
      RealOperationReceipts: [],
    });
    const airtable = new AirtableClient({
      baseId: "app00000000000000",
      token: "test-token-value",
      fetcher: createAirtableFetch(store),
    });
    const session = await issueSessionToken(user.userId, signingKey);
    authorization = `Bearer ${session.token}`;
    references = new RealCredentialReferenceRepository(airtable);
    compliance = new ComplianceAuditStub();
    dependencies = {
      users: new UserRepository(airtable),
      audit: new ComplianceAuditRecorder(compliance, () => now),
      signingKey,
      real: {
        provider: new RealCredentialProviderStub(),
        delivery: new SecureDeliveryStub(() => new Date(now).getTime()),
        references,
        allowedEnvironments: new Set(["test"]),
        now: () => now,
        operationId: () => `contract-operation-${++sequence}`,
      },
    };
  });

  it("returns a strict v2 receipt and replays one business effect", async () => {
    const first = await call(
      "/v2/applications/app-test/credentials?environment=test",
      "contract-issue-key-001",
    );
    const replay = await call(
      "/v2/applications/app-test/credentials?environment=test",
      "contract-issue-key-001",
    );

    expect(first?.status).toBe(200);
    expect(first?.headers.get("content-type")).toBe(
      "application/vnd.keyops.v2+json",
    );
    const firstBody = await first!.json();
    const replayBody = await replay!.json();
    expect(firstBody).toEqual({
      contractVersion: "2",
      operationId: "contract-operation-1",
      requestId: expect.any(String),
      status: "confirmed",
      result: "succeeded",
      auditEventId: expect.any(String),
      delivery: {
        deliveryId: "delivery-contract-operation-1",
        expiresAt: "2026-08-15T12:02:00.000Z",
      },
    });
    expect(replayBody).toEqual(firstBody);
    expect(JSON.stringify(firstBody)).not.toMatch(/secret|password|otp|url/iu);
    expect(store.fields("RealOperationReceipts")).toHaveLength(1);
    expect(compliance.events()).toContainEqual(
      expect.objectContaining({
        operation: "credential.issue.v2",
        result: "succeeded",
        integrity: "verified",
      }),
    );
  });

  it("rotates and retrieves the same safe receipt by operation id", async () => {
    await call(
      "/v2/applications/app-test/credentials?environment=test",
      "contract-issue-key-004",
    );
    const reference = (await references.listReferences())[0]!;
    const rotated = await call(
      `/v2/applications/app-test/credentials/${encodeURIComponent(reference.referenceId)}/regenerations?environment=test`,
      "contract-rotate-key-001",
    );
    const rotatedBody = (await rotated!.json()) as { operationId: string };
    const statusRequest = new Request(
      `https://keyops.test/v2/operations/${encodeURIComponent(rotatedBody.operationId)}`,
      { method: "GET", headers: { authorization } },
    );
    const status = await realCredentialsRoute(
      statusRequest,
      createRequestContext(statusRequest),
      dependencies,
    );

    expect(status?.status).toBe(200);
    await expect(status!.json()).resolves.toMatchObject({
      contractVersion: "2",
      operationId: "contract-operation-2",
      status: "confirmed",
      result: "succeeded",
    });
  });

  it("requires server-side provider configuration and contract v2", async () => {
    const request = await createRequest(
      "/v2/applications/app-test/credentials?environment=test",
      "contract-issue-key-002",
    );
    await expect(
      realCredentialsRoute(request, createRequestContext(request), {
        users: dependencies.users,
        audit: dependencies.audit,
        signingKey,
      }),
    ).rejects.toMatchObject({ code: "real_credentials_not_configured" });

    const unsupported = await createRequest(
      "/v2/applications/app-test/credentials?environment=test",
      "contract-issue-key-003",
      { "x-keyops-contract-version": "3" },
    );
    await expect(
      realCredentialsRoute(
        unsupported,
        createRequestContext(unsupported),
        dependencies,
      ),
    ).rejects.toMatchObject({
      code: "unsupported_contract_version",
      status: 406,
    });
  });

  async function call(path: string, key: string) {
    const request = await createRequest(path, key);
    return realCredentialsRoute(
      request,
      createRequestContext(request),
      dependencies,
    );
  }

  async function createRequest(
    path: string,
    key: string,
    extraHeaders: Record<string, string> = {},
  ) {
    return new Request(`https://keyops.test${path}`, {
      method: "POST",
      headers: {
        authorization,
        "idempotency-key": key,
        ...extraHeaders,
      },
    });
  }
});
