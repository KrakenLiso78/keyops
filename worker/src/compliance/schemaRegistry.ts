import { z } from "zod";
import { ApiError } from "../http/ApiError";
import {
  complianceStoredEventSchema,
  type ComplianceStoredEvent,
} from "./eventEnvelope";

const historicalEventV1Schema = z
  .object({
    eventId: z.string(),
    schemaVersion: z.literal(1),
    timestamp: z.string().datetime({ offset: true }),
    actorId: z.string().min(1),
    action: z.string(),
    resourceType: z.string(),
    resourceId: z.string().optional(),
    environment: z.enum(["test", "production"]).optional(),
    outcome: z.enum(["succeeded", "failed", "rejected"]),
    failureCode: z.string().optional(),
    ip: z.string(),
    correlationId: z.string(),
    operationId: z.string().optional(),
    applicationId: z.string().optional(),
    retentionUntil: z.string().datetime({ offset: true }),
    payloadFingerprint: z.string().regex(/^[a-f0-9]{64}$/u),
    integrityReference: z.string().min(1),
    integrity: z.enum(["verified", "failed", "unavailable"]),
  })
  .strict();

export function readComplianceEvent(input: unknown): ComplianceStoredEvent {
  const current = complianceStoredEventSchema.safeParse(input);
  if (current.success) return current.data;
  const historical = historicalEventV1Schema.safeParse(input);
  if (!historical.success) {
    throw new ApiError(
      502,
      "unsupported_compliance_schema",
      "El almacén devolvió un evento de versión no soportada.",
      true,
    );
  }
  return complianceStoredEventSchema.parse({
    eventId: historical.data.eventId,
    schemaVersion: 2,
    occurredAt: historical.data.timestamp,
    actorUserId: historical.data.actorId,
    operation: historical.data.action,
    resourceType: historical.data.resourceType,
    resourceId: historical.data.resourceId,
    environment: historical.data.environment,
    result: historical.data.outcome,
    failureCode: historical.data.failureCode,
    originIp: historical.data.ip,
    requestId: historical.data.correlationId,
    operationId: historical.data.operationId,
    applicationId: historical.data.applicationId,
    retentionUntil: historical.data.retentionUntil,
    payloadFingerprint: historical.data.payloadFingerprint,
    integrityReference: historical.data.integrityReference,
    integrity: historical.data.integrity,
  });
}
