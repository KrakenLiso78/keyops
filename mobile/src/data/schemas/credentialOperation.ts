import { z } from 'zod';
import { contractVersionSchema } from './common';
export const protectedDeliverySchema = z.object({
  deliveryUrl: z.string().url(),
  otp: z.string().min(1),
  otpExpiresAt: z.string().datetime({ offset: true }),
});
export const credentialOperationSchema = z.object({
  contractVersion: contractVersionSchema,
  operationId: z.string().min(1),
  requestId: z.string().min(1),
  auditEventId: z.string().min(1),
  result: z.enum(['succeeded', 'failed', 'rejected']),
  delivery: protectedDeliverySchema.optional(),
});
