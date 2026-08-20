import { describe, expect, it } from "vitest";
import { queryComplianceEvents } from "../../src/compliance/queryComplianceEvents";
import type { ComplianceStoredEvent } from "../../src/compliance/eventEnvelope";
import { ComplianceAuditStub } from "../support/ComplianceAuditStub";

function event(index: number): ComplianceStoredEvent {
  const suffix = String(index).padStart(2, "0");
  return {
    eventId: `cmp-${String(index).padStart(32, "0")}`,
    schemaVersion: 2,
    occurredAt: `2026-08-15T12:${suffix}:00.000Z`,
    actorUserId: index % 2 ? "auditor-one" : "auditor-two",
    operation: "audit.list.v2",
    resourceType: "audit_collection",
    applicationId: index % 2 ? "app-one" : "app-two",
    result: index % 3 ? "succeeded" : "rejected",
    originIp: "203.0.113.23",
    requestId: `request-query-${suffix}`,
    retentionUntil: `2031-08-15T12:${suffix}:00.000Z`,
    payloadFingerprint: String(index).padStart(64, "0"),
    integrityReference: `worm:query:${suffix}`,
    integrity: "verified",
  };
}

describe("compliance query", () => {
  it("applies filters, deterministic order and opaque cursor pages of 20", async () => {
    const store = new ComplianceAuditStub();
    for (let index = 24; index >= 0; index -= 1) store.seed(event(index));

    const first = await queryComplianceEvents(store, {});
    const second = await queryComplianceEvents(store, {
      cursor: first.nextCursor,
    });
    expect(first.items).toHaveLength(20);
    expect(second.items).toHaveLength(5);
    expect(
      [...first.items, ...second.items].map(({ occurredAt }) => occurredAt),
    ).toEqual(
      [...first.items, ...second.items]
        .map(({ occurredAt }) => occurredAt)
        .sort(),
    );

    const filtered = await queryComplianceEvents(store, {
      actorUserId: "auditor-one",
      applicationId: "app-one",
      result: "succeeded",
    });
    expect(filtered.items.length).toBeGreaterThan(0);
    expect(filtered.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorUserId: "auditor-one",
          applicationId: "app-one",
          result: "succeeded",
        }),
      ]),
    );
  });
});
