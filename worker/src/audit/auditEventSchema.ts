import { z } from "zod";
import { environmentSchema } from "../airtable/applicationSchema";

export const auditResultSchema = z.enum(["succeeded", "failed", "rejected"]);
export type AuditResult = z.infer<typeof auditResultSchema>;

export const auditOperationSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_.-]{1,78}\.v1$/u);
export const auditResourceTypeSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_-]{1,49}$/u);

const safeIdentifier = z.string().min(1).max(200);

export const auditEventFieldsSchema = z
  .object({
    eventId: z.string().regex(/^evt-[A-Za-z0-9_-]{12,100}$/u),
    mode: z.enum(["fake", "real"]).optional(),
    schemaVersion: z.literal(1),
    occurredAt: z.string().datetime({ offset: true }),
    actorUserId: safeIdentifier,
    actorDisplayName: z.string().min(1).max(200),
    operation: auditOperationSchema,
    resourceType: auditResourceTypeSchema,
    resourceId: safeIdentifier.optional(),
    environment: environmentSchema.optional(),
    institutionId: safeIdentifier.optional(),
    applicationId: safeIdentifier.optional(),
    credentialId: safeIdentifier.optional(),
    result: auditResultSchema,
    originIp: z.string().min(2).max(45),
    failureCode: z
      .string()
      .regex(/^[a-z][a-z0-9_]{1,79}$/u)
      .optional(),
    requestId: z.string().regex(/^[A-Za-z0-9._:-]{8,128}$/u),
    operationId: safeIdentifier.optional(),
    testRunId: z
      .string()
      .regex(/^[A-Za-z0-9_-]{4,80}$/u)
      .optional(),
  })
  .strict();

export type AuditEventFields = z.infer<typeof auditEventFieldsSchema>;

export interface PersistedAuditEvent {
  recordId: string;
  fields: AuditEventFields;
}

export const publicAuditEventSchema = z
  .object({
    id: auditEventFieldsSchema.shape.eventId,
    occurredAt: auditEventFieldsSchema.shape.occurredAt,
    actorUserId: auditEventFieldsSchema.shape.actorUserId,
    actorDisplayName: auditEventFieldsSchema.shape.actorDisplayName,
    operation: auditEventFieldsSchema.shape.operation,
    resourceType: auditEventFieldsSchema.shape.resourceType,
    resourceId: auditEventFieldsSchema.shape.resourceId,
    environment: auditEventFieldsSchema.shape.environment,
    institutionId: auditEventFieldsSchema.shape.institutionId,
    applicationId: auditEventFieldsSchema.shape.applicationId,
    credentialId: auditEventFieldsSchema.shape.credentialId,
    result: auditEventFieldsSchema.shape.result,
    originIp: auditEventFieldsSchema.shape.originIp,
    failureCause: auditEventFieldsSchema.shape.failureCode,
    requestId: auditEventFieldsSchema.shape.requestId,
  })
  .strict();

export type PublicAuditEvent = z.infer<typeof publicAuditEventSchema>;

export function publicAuditEvent(fields: AuditEventFields): PublicAuditEvent {
  return publicAuditEventSchema.parse({
    id: fields.eventId,
    occurredAt: fields.occurredAt,
    actorUserId: fields.actorUserId,
    actorDisplayName: fields.actorDisplayName,
    operation: fields.operation,
    resourceType: fields.resourceType,
    resourceId: fields.resourceId,
    environment: fields.environment,
    institutionId: fields.institutionId,
    applicationId: fields.applicationId,
    credentialId: fields.credentialId,
    result: fields.result,
    originIp: fields.originIp,
    failureCause: fields.failureCode,
    requestId: fields.requestId,
  });
}
