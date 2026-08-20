import type { ComplianceAuditPort } from "./ComplianceAuditPort";
import { ApiError } from "../http/ApiError";

export async function verifyComplianceEvent(
  port: ComplianceAuditPort,
  eventId: string,
) {
  const result = await port.verify(eventId);
  if (result.eventId !== eventId) {
    throw new ApiError(
      502,
      "integrity_reference_mismatch",
      "La verificación no corresponde al evento solicitado.",
      true,
    );
  }
  return result;
}
