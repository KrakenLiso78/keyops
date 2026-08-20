import type { ComplianceAuditPort } from "../compliance/ComplianceAuditPort";
import type { ComplianceEvent } from "../compliance/eventEnvelope";
import { ApiError } from "../http/ApiError";

export async function reconcileAudit(
  port: ComplianceAuditPort,
  expected: ComplianceEvent,
): Promise<void> {
  const stored = await port.get(expected.eventId);
  if (
    !stored ||
    stored.payloadFingerprint !== expected.payloadFingerprint ||
    stored.retentionUntil !== expected.retentionUntil ||
    stored.integrity !== "verified"
  ) {
    throw new ApiError(
      503,
      "audit_reconciliation_required",
      "La evidencia requiere reconciliación con el almacén de cumplimiento.",
      true,
    );
  }
}
