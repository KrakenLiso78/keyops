import { beforeEach, describe, expect, it, vi } from "vitest";
import { issueSessionToken } from "../../src/auth/sessionToken";
import type {
  ApiRoleFields,
  ApplicationFields,
  InstitutionFields,
} from "../../src/airtable/applicationSchema";
import type { AuditEventFields } from "../../src/audit/auditEventSchema";
import { handleRequest } from "../../src/index";
import {
  applicationRecords,
  institutionRecords,
  roleRecords,
} from "../fixtures/applications";
import { userFixtures } from "../fixtures/users";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { createAirtableFetch } from "../support/createAirtableFetch";
import { applicationEnv } from "../support/contractEnv";

function setup() {
  return new InMemoryCredentialStore({
    Users: [
      {
        ...userFixtures[0]!,
        permissions: ["applications:read", "credentials:issue"],
      },
    ],
    Institutions: institutionRecords.map(
      ({ fields }) => fields satisfies InstitutionFields,
    ),
    ApiRoles: roleRecords.map(({ fields }) => fields satisfies ApiRoleFields),
    Applications: [
      {
        ...applicationRecords[0]!.fields,
        credentialState: "no_credentials",
        currentCredentialId: undefined,
      } satisfies ApplicationFields,
    ],
    Credentials: [],
    CredentialVersions: [],
    DeliveryGrants: [],
    IdempotencyRecords: [],
    AuditEvents: [],
  });
}

async function authorization() {
  const { token } = await issueSessionToken(
    "user-analyst",
    applicationEnv.SESSION_SIGNING_KEY,
  );
  return { authorization: `Bearer ${token}` };
}

function issueRequest(key: string, requestId: string, authenticated = true) {
  return authorization().then(
    (header) =>
      new Request(
        "https://keyops.test/v1/applications/app-test/credentials?environment=test",
        {
          method: "POST",
          headers: {
            ...(authenticated ? header : {}),
            "idempotency-key": key,
            "x-request-id": requestId,
            "cf-connecting-ip": "203.0.113.60",
          },
        },
      ),
  );
}

describe("persistent audit write contract", () => {
  let store: InMemoryCredentialStore;

  beforeEach(() => {
    store = setup();
    vi.stubGlobal("fetch", createAirtableFetch(store));
  });

  it("records session and application access with safe request context", async () => {
    const session = await handleRequest(
      new Request("https://keyops.test/v1/sessions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-request-id": "request-session-audit-0001",
          "cf-connecting-ip": "203.0.113.61",
        },
        body: JSON.stringify({
          loginIdentifier: "analyst@example.invalid",
          password: "correct-password",
        }),
      }),
      {
        ...applicationEnv,
        DEMO_CREDENTIALS_JSON: JSON.stringify({
          "analyst@example.invalid": "correct-password",
        }),
      },
    );
    expect(session.status).toBe(200);
    const listed = await handleRequest(
      new Request("https://keyops.test/v1/applications?environment=test", {
        headers: {
          ...(await authorization()),
          "x-request-id": "request-list-audit-0001",
          "cf-connecting-ip": "203.0.113.62",
        },
      }),
      applicationEnv,
    );
    expect(listed.status).toBe(200);
    expect(store.fields<AuditEventFields>("AuditEvents")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          operation: "session.create.v1",
          result: "succeeded",
          originIp: "203.0.113.61",
        }),
        expect.objectContaining({
          operation: "application.list.v1",
          result: "succeeded",
          originIp: "203.0.113.62",
        }),
      ]),
    );
  });

  it("writes one credential event and preserves its id on idempotent replay", async () => {
    const first = await handleRequest(
      await issueRequest("audit-issue-key-000001", "request-issue-audit-0001"),
      applicationEnv,
    );
    const replay = await handleRequest(
      await issueRequest("audit-issue-key-000001", "request-issue-audit-0002"),
      applicationEnv,
    );
    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    const firstBody = (await first.json()) as { auditEventId: string };
    const replayBody = (await replay.json()) as { auditEventId: string };
    expect(replayBody.auditEventId).toBe(firstBody.auditEventId);
    const events = store
      .fields<AuditEventFields>("AuditEvents")
      .filter(({ operation }) => operation === "credential.issue.v1");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      eventId: firstBody.auditEventId,
      actorUserId: "user-analyst",
      applicationId: "app-test",
      result: "succeeded",
    });
  });

  it("records an anonymous authorization rejection", async () => {
    const response = await handleRequest(
      await issueRequest(
        "audit-reject-key-0001",
        "request-reject-audit-0001",
        false,
      ),
      applicationEnv,
    );
    expect(response.status).toBe(401);
    expect(store.fields<AuditEventFields>("AuditEvents")).toContainEqual(
      expect.objectContaining({
        operation: "credential.issue.v1",
        actorUserId: "anonymous",
        result: "rejected",
        failureCode: "invalid_session",
      }),
    );
  });

  it("records an established actor when domain authorization rejects", async () => {
    const userRecord = (await store.list<Record<string, unknown>>("Users"))[0]!;
    await store.update("Users", userRecord.id, {
      permissions: ["applications:read"],
    });
    const response = await handleRequest(
      await issueRequest(
        "audit-forbidden-key-0001",
        "request-forbidden-audit-01",
      ),
      applicationEnv,
    );
    expect(response.status).toBe(403);
    expect(store.fields<AuditEventFields>("AuditEvents")).toContainEqual(
      expect.objectContaining({
        operation: "credential.issue.v1",
        actorUserId: "user-analyst",
        result: "rejected",
        failureCode: "forbidden",
      }),
    );
  });

  it("records a provider failure without communicating success", async () => {
    const baseFetch = createAirtableFetch(store);
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input
              : input.url,
        );
        const table = decodeURIComponent(url.pathname.split("/").at(-1) ?? "");
        if (table === "Credentials" && init?.method === "POST") {
          return Response.json(
            { error: { type: "SIMULATED_FAILURE" } },
            { status: 500 },
          );
        }
        return baseFetch(input, init);
      },
    );
    const response = await handleRequest(
      await issueRequest("audit-failure-key-0001", "request-failure-audit-01"),
      applicationEnv,
    );
    expect(response.status).toBe(503);
    expect(store.fields<AuditEventFields>("AuditEvents")).toContainEqual(
      expect.objectContaining({
        operation: "credential.issue.v1",
        result: "failed",
        failureCode: "provider_unavailable",
      }),
    );
  });
});
