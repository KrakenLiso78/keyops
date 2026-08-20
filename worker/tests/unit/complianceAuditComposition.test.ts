import { describe, expect, it } from "vitest";
import {
  AuditRecorder,
  ComplianceAuditRecorder,
  DualAuditRecorder,
} from "../../src/audit/AuditRecorder";
import { ComplianceAuditStub } from "../support/ComplianceAuditStub";
import { InMemoryAuditRepository } from "../support/InMemoryAuditRepository";

describe("compliance audit composition", () => {
  it("requires WORM evidence and also retains the functional Airtable event", async () => {
    const compliance = new ComplianceAuditStub();
    const functional = new InMemoryAuditRepository();
    const audit = new DualAuditRecorder(
      new ComplianceAuditRecorder(compliance, () => "2026-08-15T13:00:00.000Z"),
      new AuditRecorder(functional, () => "2026-08-15T13:00:00.000Z"),
    );
    const receipt = await audit.append({
      operation: "user.update.v1",
      resourceType: "user",
      resourceId: "user-001",
      result: "succeeded",
      context: {
        requestId: "request-dual-audit-0001",
        originIp: "203.0.113.27",
        startedAt: "2026-08-15T13:00:00.000Z",
      },
    });

    expect(receipt.auditEventId).toMatch(/^cmp-/u);
    expect(compliance.events()).toHaveLength(1);
    expect(await functional.list()).toHaveLength(1);
  });

  it("does not write functional success when WORM persistence is unavailable", async () => {
    const compliance = new ComplianceAuditStub();
    compliance.failNextBeforeEffect();
    const functional = new InMemoryAuditRepository();
    const audit = new DualAuditRecorder(
      new ComplianceAuditRecorder(compliance),
      new AuditRecorder(functional),
    );

    await expect(
      audit.append({
        operation: "application.view.v1",
        resourceType: "application",
        result: "succeeded",
        context: {
          requestId: "request-dual-audit-0002",
          originIp: "203.0.113.28",
          startedAt: "2026-08-15T13:01:00.000Z",
        },
      }),
    ).rejects.toMatchObject({ code: "audit_reconciliation_required" });
    expect(await functional.list()).toHaveLength(0);
  });
});
