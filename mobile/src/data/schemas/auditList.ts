import { z } from 'zod';

export const auditEventSchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().datetime(),
  actorDisplayName: z.string().min(1),
  operation: z.string().min(1),
  environment: z.enum(['test', 'production']),
  institution: z.string().optional(),
  application: z.string().optional(),
  result: z.enum(['succeeded', 'failed', 'rejected']),
  requestId: z.string().min(1),
});

export const auditPageSchema = z.object({
  contractVersion: z.literal('1'),
  items: z.array(auditEventSchema),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
});
