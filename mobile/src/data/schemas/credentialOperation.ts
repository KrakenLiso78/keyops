import { z } from 'zod';
import { contractVersionSchema } from './common';
export const protectedDeliverySchema = z.object({
  deliveryId: z.string().min(1),
  credentialVersionId: z.string().min(1),
  deliveryUrl: z.string().url(),
  otp: z.string().min(1),
  otpExpiresAt: z.string().datetime({ offset: true }),
  createdAt: z.string().datetime({ offset: true }),
});
export const credentialOperationSchema = z.object({
  contractVersion: contractVersionSchema,
  operationId: z.string().min(1),
  requestId: z.string().min(1),
  auditEventId: z.string().min(1).optional(),
  result: z.enum(['succeeded', 'failed', 'rejected']),
  delivery: protectedDeliverySchema.optional(),
});

export const syntheticArtifactSchema = z
  .object({
    classification: z.literal('SYNTHETIC-NON-FUNCTIONAL'),
    applicationId: z.string().min(1),
    credentialVersionId: z.string().min(1),
    generatedAt: z.string().datetime({ offset: true }),
  })
  .strict();
