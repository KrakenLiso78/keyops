import { z } from 'zod';

export const auditEventSchema = z
  .object({
    id: z.string().min(1),
    occurredAt: z.string().datetime(),
    actorUserId: z.string().min(1),
    actorDisplayName: z.string().min(1),
    operation: z.string().min(1),
    resourceType: z.string().min(1),
    resourceId: z.string().min(1).optional(),
    environment: z.enum(['test', 'production']).optional(),
    institutionId: z.string().min(1).optional(),
    applicationId: z.string().min(1).optional(),
    credentialId: z.string().min(1).optional(),
    result: z.enum(['succeeded', 'failed', 'rejected']),
    originIp: z.string().min(2),
    failureCause: z.string().min(1).optional(),
    requestId: z.string().min(1),
  })
  .strict();

export const auditPageSchema = z
  .object({
    contractVersion: z.literal('1'),
    items: z.array(auditEventSchema),
    page: z.number().int().positive(),
    pageSize: z.literal(20),
    total: z.number().int().nonnegative(),
  })
  .strict();
