import type { ComplianceAuditPort } from "./ComplianceAuditPort";
import { ApiError } from "../http/ApiError";

export async function runRecoveryProbe(
  port: ComplianceAuditPort,
  request: { runId: string; from?: string; to?: string },
) {
  const evidence = await port.runRecoveryProbe(request);
  if (
    !evidence.countMatches ||
    !evidence.orderMatches ||
    !evidence.integrityVerified ||
    evidence.sourceCount !== evidence.recoveredCount
  ) {
    throw new ApiError(
      503,
      "compliance_recovery_failed",
      "La recuperación no preservó toda la evidencia.",
      true,
    );
  }
  return evidence;
}
