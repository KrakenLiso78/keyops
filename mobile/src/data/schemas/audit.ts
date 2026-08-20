import { z } from 'zod';

export const integrityStatusSchema = z.enum(['verified', 'failed', 'unavailable']);

export const complianceAuditEventSchema = z
  .object({
    eventId: z.string().min(1),
    schemaVersion: z.number().int().positive(),
    occurredAt: z.string().datetime(),
    actorUserId: z.string().min(1),
    operation: z.string().min(1),
    resourceType: z.string().min(1),
    resourceId: z.string().min(1).optional(),
    environment: z.enum(['test', 'production']).optional(),
    applicationId: z.string().min(1).optional(),
    result: z.enum(['succeeded', 'failed', 'rejected']),
    originIp: z.string().min(2),
    requestId: z.string().min(1),
    operationId: z.string().min(1).optional(),
    integrity: integrityStatusSchema,
    retentionUntil: z.string().datetime(),
  })
  .strict();

export const complianceAuditPageSchema = z
  .object({
    items: z.array(complianceAuditEventSchema),
    nextCursor: z.string().min(1).optional(),
  })
  .strict();

export const integrityVerificationSchema = z
  .object({
    eventId: z.string().min(1),
    status: integrityStatusSchema,
    verifiedAt: z.string().datetime(),
    retentionUntil: z.string().datetime(),
  })
  .strict();
