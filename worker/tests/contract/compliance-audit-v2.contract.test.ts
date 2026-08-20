import { beforeEach, describe, expect, it } from "vitest";
import current from "../fixtures/compliance/event-v2.json";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { UserRepository } from "../../src/airtable/UserRepository";
import type { UserFields } from "../../src/airtable/userSchema";
import { ComplianceAuditRecorder } from "../../src/audit/AuditRecorder";
import { issueSessionToken } from "../../src/auth/sessionToken";
import { createRequestContext } from "../../src/http/requestContext";
import { complianceAuditRoute } from "../../src/routes/v2/audit";
import { ComplianceAuditStub } from "../support/ComplianceAuditStub";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { createAirtableFetch } from "../support/createAirtableFetch";

const signingKey = "compliance-contract-key-with-at-least-32-characters";
const auditor: UserFields = {
  userId: "compliance-auditor",
  loginIdentifier: "auditor@example.invalid",
  displayName: "Auditor",
  profile: "auditor",
  enabled: true,
  permissions: ["audit:read"],
};

describe("KeyOps compliance audit API v2", () => {
  let authorization: string;
  let compliance: ComplianceAuditStub;
  let dependencies: Parameters<typeof complianceAuditRoute>[2];

  beforeEach(async () => {
    const data = new InMemoryCredentialStore({ Users: [auditor] });
    const airtable = new AirtableClient({
      baseId: "app00000000000000",
      token: "test-token-value",
      fetcher: createAirtableFetch(data),
    });
    authorization = `Bearer ${
      (await issueSessionToken(auditor.userId, signingKey)).token
    }`;
    compliance = new ComplianceAuditStub();
    compliance.seed(current);
    dependencies = {
      users: new UserRepository(airtable),
      audit: new ComplianceAuditRecorder(
        compliance,
        () => "2026-08-15T12:45:00.000Z",
      ),
      compliance,
      signingKey,
    };
  });

  it("returns a strict verified page and exposes integrity verification", async () => {
    const list = request("/v2/audit-events?result=succeeded");
    const response = await complianceAuditRoute(
      list,
      createRequestContext(list),
      dependencies,
    );

    expect(response?.status).toBe(200);
    expect(response?.headers.get("content-type")).toBe(
      "application/vnd.keyops.v2+json",
    );
    await expect(response!.json()).resolves.toEqual({
      items: [
        {
          eventId: current.eventId,
          schemaVersion: 2,
          occurredAt: current.occurredAt,
          actorUserId: current.actorUserId,
          operation: current.operation,
          resourceType: current.resourceType,
          environment: current.environment,
          result: current.result,
          originIp: current.originIp,
          requestId: current.requestId,
          integrity: "verified",
          retentionUntil: current.retentionUntil,
        },
      ],
    });

    const verify = request(
      `/v2/audit-events/${encodeURIComponent(current.eventId)}/integrity`,
    );
    const integrity = await complianceAuditRoute(
      verify,
      createRequestContext(verify),
      dependencies,
    );
    await expect(integrity!.json()).resolves.toEqual({
      eventId: current.eventId,
      status: "verified",
      verifiedAt: "2026-08-15T12:30:00.000Z",
      retentionUntil: current.retentionUntil,
    });
  });

  it("has no update or delete operation and preserves the original", async () => {
    for (const method of ["PUT", "PATCH", "DELETE"]) {
      const mutation = request("/v2/audit-events", method);
      await expect(
        complianceAuditRoute(
          mutation,
          createRequestContext(mutation),
          dependencies,
        ),
      ).rejects.toMatchObject({ code: "method_not_allowed", status: 405 });
    }
    expect(await compliance.get(current.eventId)).toEqual(current);
  });

  it("rejects a valid session without audit permission", async () => {
    const data = new InMemoryCredentialStore({
      Users: [{ ...auditor, userId: "plain-user", permissions: [] }],
    });
    const airtable = new AirtableClient({
      baseId: "app00000000000000",
      token: "test-token-value",
      fetcher: createAirtableFetch(data),
    });
    const token = await issueSessionToken("plain-user", signingKey);
    const denied = new Request("https://keyops.test/v2/audit-events", {
      headers: { authorization: `Bearer ${token.token}` },
    });

    await expect(
      complianceAuditRoute(denied, createRequestContext(denied), {
        ...dependencies,
        users: new UserRepository(airtable),
      }),
    ).rejects.toMatchObject({ code: "forbidden", status: 403 });
  });

  function request(path: string, method = "GET") {
    return new Request(`https://keyops.test${path}`, {
      method,
      headers: { authorization },
    });
  }
});
