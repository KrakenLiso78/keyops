import { z } from "zod";
import { environmentSchema } from "../airtable/applicationSchema";

const safeIdentifier = z.string().min(1).max(200);

export const complianceResultSchema = z.enum([
  "succeeded",
  "failed",
  "rejected",
]);
export const integrityStatusSchema = z.enum([
  "verified",
  "failed",
  "unavailable",
]);
export type IntegrityStatus = z.infer<typeof integrityStatusSchema>;

export const complianceEventSchema = z
  .object({
    eventId: z.string().regex(/^cmp-[a-f0-9]{32}$/u),
    schemaVersion: z.literal(2),
    occurredAt: z.string().datetime({ offset: true }),
    actorUserId: safeIdentifier,
    operation: z.string().regex(/^[a-z][a-z0-9_.-]{1,78}\.v[12]$/u),
    resourceType: z.string().regex(/^[a-z][a-z0-9_-]{1,49}$/u),
    resourceId: safeIdentifier.optional(),
    environment: environmentSchema.optional(),
    result: complianceResultSchema,
    failureCode: z
      .string()
      .regex(/^[a-z][a-z0-9_]{1,79}$/u)
      .optional(),
    originIp: z.string().min(2).max(45),
    requestId: z.string().regex(/^[A-Za-z0-9._:-]{8,128}$/u),
    operationId: safeIdentifier.optional(),
    applicationId: safeIdentifier.optional(),
    retentionUntil: z.string().datetime({ offset: true }),
    payloadFingerprint: z.string().regex(/^[a-f0-9]{64}$/u),
  })
  .strict();

export const complianceStoredEventSchema = complianceEventSchema
  .extend({
    integrityReference: z.string().min(1).max(300),
    integrity: integrityStatusSchema,
  })
  .strict();

export type ComplianceEvent = z.infer<typeof complianceEventSchema>;
export type ComplianceStoredEvent = z.infer<typeof complianceStoredEventSchema>;

export const publicComplianceEventSchema = complianceStoredEventSchema
  .pick({
    eventId: true,
    schemaVersion: true,
    occurredAt: true,
    actorUserId: true,
    operation: true,
    resourceType: true,
    resourceId: true,
    environment: true,
    result: true,
    originIp: true,
    requestId: true,
    operationId: true,
    applicationId: true,
    integrity: true,
    retentionUntil: true,
  })
  .strip();

export type PublicComplianceEvent = z.infer<typeof publicComplianceEventSchema>;
