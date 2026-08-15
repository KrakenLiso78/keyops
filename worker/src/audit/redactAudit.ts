import { ApiError } from "../http/ApiError";
import {
  auditEventFieldsSchema,
  type AuditEventFields,
} from "./auditEventSchema";

const allowedFields = new Set(Object.keys(auditEventFieldsSchema.shape));
const forbiddenValue =
  /(?:https?:\/\/|bearer\s+|client.?secret|\bpassword\b|\botp\b)/iu;

export function redactAudit(input: unknown): AuditEventFields {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ApiError(
      500,
      "invalid_audit_event",
      "No se pudo construir la evidencia de auditoría.",
    );
  }
  for (const [key, value] of Object.entries(input)) {
    if (!allowedFields.has(key)) {
      throw new ApiError(
        500,
        "unsafe_audit_field",
        "La evidencia contiene un campo no permitido.",
      );
    }
    if (typeof value === "string" && forbiddenValue.test(value)) {
      throw new ApiError(
        500,
        "unsafe_audit_value",
        "La evidencia contiene material no permitido.",
      );
    }
  }
  const withoutUndefined = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
  const parsed = auditEventFieldsSchema.safeParse(withoutUndefined);
  if (!parsed.success) {
    throw new ApiError(
      500,
      "invalid_audit_event",
      "No se pudo construir la evidencia de auditoría.",
    );
  }
  return parsed.data;
}
