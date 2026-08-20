import { describe, expect, it } from "vitest";
import {
  buildComplianceEvent,
  recordComplianceTamperAttempt,
} from "../../src/compliance/appendComplianceEvent";
import { ComplianceAuditStub } from "../support/ComplianceAuditStub";

describe("compliance tamper resistance", () => {
  it("rejects update/delete semantics, preserves the original and records the attempt", async () => {
    const store = new ComplianceAuditStub();
    const context = {
      requestId: "request-tamper-original-001",
      originIp: "203.0.113.24",
      startedAt: "2026-08-15T12:00:00.000Z",
    };
    const original = await buildComplianceEvent({
      operation: "credential.issue.v2",
      resourceType: "real_credential",
      resourceId: "real-one",
      result: "succeeded",
      context,
    });
    await store.append(original, original.eventId);
    const before = await store.get(original.eventId);

    expect(() => store.attemptMutation(original.eventId)).toThrow(
      expect.objectContaining({ code: "immutable_event" }),
    );
    await recordComplianceTamperAttempt({
      port: store,
      targetEventId: original.eventId,
      occurredAt: "2026-08-15T12:05:00.000Z",
      attempt: {
        context: {
          requestId: "request-tamper-attempt-002",
          originIp: "203.0.113.25",
          startedAt: "2026-08-15T12:05:00.000Z",
        },
      },
    });

    expect(await store.get(original.eventId)).toEqual(before);
    expect(store.events()).toContainEqual(
      expect.objectContaining({
        operation: "audit.tamper_attempt.v2",
        resourceId: original.eventId,
        result: "rejected",
        failureCode: "immutable_event",
      }),
    );
  });
});
