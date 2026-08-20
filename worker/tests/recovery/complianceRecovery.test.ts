import { describe, expect, it } from "vitest";
import current from "../fixtures/compliance/event-v2.json";
import legacy from "../fixtures/compliance/event-v1.json";
import { runRecoveryProbe } from "../../src/compliance/runRecoveryProbe";
import { ComplianceAuditStub } from "../support/ComplianceAuditStub";

describe("compliance recovery drill", () => {
  it("preserves count, order and integrity across schema versions", async () => {
    const store = new ComplianceAuditStub();
    store.seed(current);
    store.seed(legacy);

    await expect(
      runRecoveryProbe(store, { runId: "recovery-local-001" }),
    ).resolves.toMatchObject({
      sourceCount: 2,
      recoveredCount: 2,
      countMatches: true,
      orderMatches: true,
      integrityVerified: true,
    });
  });

  it("fails closed when one recovered event is missing", async () => {
    const store = new ComplianceAuditStub();
    store.seed(current);
    store.seed(legacy);
    store.corruptNextRecovery();

    await expect(
      runRecoveryProbe(store, { runId: "recovery-local-002" }),
    ).rejects.toMatchObject({ code: "compliance_recovery_failed" });
  });
});
