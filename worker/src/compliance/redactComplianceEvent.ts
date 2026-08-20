import { ApiError } from "../http/ApiError";
import { complianceEventSchema, type ComplianceEvent } from "./eventEnvelope";

const allowedFields = new Set(Object.keys(complianceEventSchema.shape));
const forbiddenValue =
  /(?:https?:\/\/|bearer\s+|client.?secret|password|\botp\b|access.?token|refresh.?token|zip.?password)/iu;
const unnecessaryPersonalData = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function redactComplianceEvent(input: unknown): ComplianceEvent {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw unsafe("invalid_compliance_event");
  }
  for (const [key, value] of Object.entries(input)) {
    if (!allowedFields.has(key)) throw unsafe("unsafe_compliance_field");
    if (
      typeof value === "string" &&
      (forbiddenValue.test(value) ||
        (key !== "originIp" && unnecessaryPersonalData.test(value)))
    ) {
      throw unsafe("unsafe_compliance_value");
    }
  }
  const parsed = complianceEventSchema.safeParse(
    Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ),
  );
  if (!parsed.success) throw unsafe("invalid_compliance_event");
  return parsed.data;
}

function unsafe(code: string): ApiError {
  return new ApiError(
    500,
    code,
    "No se pudo construir la evidencia de cumplimiento.",
  );
}
