import { describe, expect, it } from "vitest";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import type { AuditEventFields } from "../../src/audit/auditEventSchema";
import { listAuditEvents } from "../../src/audit/listAuditEvents";
import { InMemoryAuditRepository } from "../support/InMemoryAuditRepository";

const reader: AuthorizedUser = {
  id: "user-senior",
  loginIdentifier: "senior@example.invalid",
  displayName: "Analista Senior",
  profile: "senior_analyst",
  enabled: true,
  permissions: ["audit:read"],
};

function event(overrides: Partial<AuditEventFields>): AuditEventFields {
  return {
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
    originIp: "203.0.113.70",
    requestId: "request-audit-query-0001",
    ...overrides,
  };
}

async function repository(events: AuditEventFields[]) {
  const store = new InMemoryAuditRepository();
  for (const item of events) await store.append(item);
  return store;
}

describe("audit query", () => {
  it("requires the explicit audit permission before reading", async () => {
    const store = await repository([event({})]);
    await expect(
      listAuditEvents({ ...reader, permissions: [] }, store, { page: 1 }),
    ).rejects.toMatchObject({ status: 403, code: "forbidden" });
  });

  it("filters every supported field and keeps an empty page", async () => {
    const store = await repository([
      event({}),
      event({
        eventId: "evt-20260816120000000-bbbbbbbbbbbbbbbb",
        occurredAt: "2026-08-16T12:00:00.000Z",
        actorUserId: "user-auditor",
        institutionId: "institution-tax",
        applicationId: "app-production",
        result: "rejected",
        requestId: "request-audit-query-0002",
      }),
    ]);
    await expect(
      listAuditEvents(reader, store, {
        from: "2026-08-16T00:00:00.000Z",
        to: "2026-08-16T23:59:59.999Z",
        institutionId: "institution-tax",
        applicationId: "app-production",
        actorUserId: "user-auditor",
        result: "rejected",
        page: 1,
      }),
    ).resolves.toMatchObject({
      total: 1,
      items: [{ id: "evt-20260816120000000-bbbbbbbbbbbbbbbb" }],
    });
    await expect(
      listAuditEvents(reader, store, { actorUserId: "missing", page: 1 }),
    ).resolves.toMatchObject({ total: 0, items: [], page: 1, pageSize: 20 });
  });

  it("orders ties by event id and paginates twenty at a time", async () => {
    const events = Array.from({ length: 21 }, (_, index) =>
      event({
        eventId: `evt-20260815120000000-${index.toString(16).padStart(16, "0")}`,
        requestId: `request-audit-${index.toString().padStart(4, "0")}`,
      }),
    );
    const store = await repository(events);
    const first = await listAuditEvents(reader, store, { page: 1 });
    const second = await listAuditEvents(reader, store, { page: 2 });
    expect(first.items).toHaveLength(20);
    expect(first.items[0]!.id).toBe("evt-20260815120000000-0000000000000014");
    expect(second).toMatchObject({ total: 21, page: 2, pageSize: 20 });
    expect(second.items).toHaveLength(1);
  });
});
