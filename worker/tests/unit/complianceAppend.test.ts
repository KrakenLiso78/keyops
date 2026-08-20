import { describe, expect, it } from "vitest";
import { ComplianceAuditRecorder } from "../../src/audit/AuditRecorder";
import { buildComplianceEvent } from "../../src/compliance/appendComplianceEvent";
import { ComplianceAuditStub } from "../support/ComplianceAuditStub";

const attempt = () => ({
  operation: "credential.issue.v2",
  resourceType: "real_credential",
  resourceId: "real-app-one",
  applicationId: "app-one",
  environment: "test" as const,
  result: "succeeded" as const,
  operationId: "operation-compliance-001",
  context: {
    requestId: "request-compliance-append-001",
    originIp: "203.0.113.22",
    startedAt: "2026-08-15T12:01:00.000Z",
  },
});

describe("compliance append", () => {
  it("is idempotent for the same event and rejects conflicting payload", async () => {
    const store = new ComplianceAuditStub();
    const recorder = new ComplianceAuditRecorder(
      store,
      () => "2026-08-15T12:01:00.000Z",
    );
    const first = await recorder.append(attempt());
    const replay = await recorder.append(attempt());

    expect(replay).toEqual(first);
    expect(store.events()).toHaveLength(1);

    const event = await buildComplianceEvent(attempt());
    await expect(
      store.append(
        { ...event, payloadFingerprint: "f".repeat(64) },
        event.eventId,
      ),
    ).rejects.toMatchObject({ code: "compliance_event_conflict" });
  });

  it("recovers a persistent event after the acknowledgement is lost", async () => {
    const store = new ComplianceAuditStub();
    store.loseNextResponse();
    const recorder = new ComplianceAuditRecorder(
      store,
      () => "2026-08-15T12:01:00.000Z",
    );

    await expect(recorder.append(attempt())).resolves.toMatchObject({
      auditEventId: expect.stringMatching(/^cmp-/u),
    });
    expect(store.events()).toHaveLength(1);
  });

  it("requires reconciliation when the store failed before persistence", async () => {
    const store = new ComplianceAuditStub();
    store.failNextBeforeEffect();
    const recorder = new ComplianceAuditRecorder(store);

    await expect(recorder.append(attempt())).rejects.toMatchObject({
      code: "audit_reconciliation_required",
    });
    expect(store.events()).toHaveLength(0);
  });
});
