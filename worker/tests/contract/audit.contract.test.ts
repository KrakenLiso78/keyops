import { beforeEach, describe, expect, it, vi } from "vitest";
import { issueSessionToken } from "../../src/auth/sessionToken";
import type { AuditEventFields } from "../../src/audit/auditEventSchema";
import { handleRequest } from "../../src/index";
import { userFixtures } from "../fixtures/users";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { applicationEnv } from "../support/contractEnv";
import { createAirtableFetch } from "../support/createAirtableFetch";

const seededEvent: AuditEventFields = {
  eventId: "evt-20260815120000000-aaaaaaaaaaaaaaaa",
  schemaVersion: 1,
  occurredAt: "2026-08-15T12:00:00.000Z",
  actorUserId: "user-senior",
  actorDisplayName: "Analista Senior",
  operation: "application.list.v1",
  resourceType: "application_collection",
  environment: "test",
  institutionId: "institution-health",
  applicationId: "app-test",
  result: "succeeded",
  originIp: "203.0.113.71",
  requestId: "request-audit-contract-0001",
};

async function token(userId: string) {
  return issueSessionToken(userId, applicationEnv.SESSION_SIGNING_KEY);
}

describe("GET /v1/audit-events", () => {
  let store: InMemoryCredentialStore;

  beforeEach(() => {
    store = new InMemoryCredentialStore({
      Users: [
        {
          ...userFixtures[0]!,
          userId: "user-senior",
          permissions: ["audit:read"],
        },
        userFixtures[0]!,
      ],
      AuditEvents: [seededEvent],
    });
    vi.stubGlobal("fetch", createAirtableFetch(store));
  });

  it("returns only the filtered safe page to an authorized user", async () => {
    const session = await token("user-senior");
    const response = await handleRequest(
      new Request(
        "https://keyops.test/v1/audit-events?institutionId=institution-health&result=succeeded&page=1",
        {
          headers: {
            authorization: `Bearer ${session.token}`,
            "x-request-id": "request-audit-list-0001",
          },
        },
      ),
      applicationEnv,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      contractVersion: "1",
      page: 1,
      pageSize: 20,
      total: 1,
      items: [{ id: seededEvent.eventId, applicationId: "app-test" }],
    });
  });

  it("rejects a direct analyst and records the established actor", async () => {
    const session = await token("user-analyst");
    const response = await handleRequest(
      new Request("https://keyops.test/v1/audit-events", {
        headers: { authorization: `Bearer ${session.token}` },
      }),
      applicationEnv,
    );
    expect(response.status).toBe(403);
    expect(store.fields<AuditEventFields>("AuditEvents")).toContainEqual(
      expect.objectContaining({
        operation: "audit.list.v1",
        actorUserId: "user-analyst",
        result: "rejected",
        failureCode: "forbidden",
      }),
    );
  });

  it.each(["POST", "PATCH", "PUT", "DELETE"])(
    "does not expose %s mutation",
    async (method) => {
      const session = await token("user-senior");
      const response = await handleRequest(
        new Request("https://keyops.test/v1/audit-events", {
          method,
          headers: { authorization: `Bearer ${session.token}` },
        }),
        applicationEnv,
      );
      expect(response.status).toBe(405);
      const events = store.fields<AuditEventFields>("AuditEvents");
      expect(
        events.find(({ eventId }) => eventId === seededEvent.eventId),
      ).toEqual(seededEvent);
      expect(events).toContainEqual(
        expect.objectContaining({
          operation: "audit.list.v1",
          result: "rejected",
          failureCode: "method_not_allowed",
        }),
      );
    },
  );
});
