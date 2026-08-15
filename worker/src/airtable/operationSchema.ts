import { z } from "zod";
import { environmentSchema } from "./applicationSchema";

export const deliveryGrantFieldsSchema = z.object({
  deliveryId: z.string().min(1),
  credentialVersionId: z.string().min(1),
  applicationId: z.string().min(1),
  environment: environmentSchema,
  codeDigest: z.string().regex(/^[a-f0-9]{64}$/u),
  expiresAt: z.string().datetime({ offset: true }),
  consumedAt: z.string().datetime({ offset: true }).optional(),
  invalidatedAt: z.string().datetime({ offset: true }).optional(),
  operationId: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
  schemaVersion: z.literal("1"),
});
export type DeliveryGrantFields = z.infer<typeof deliveryGrantFieldsSchema>;

export const safeDeliveryReceiptSchema = z
  .object({
    deliveryId: z.string().min(1),
    credentialVersionId: z.string().min(1),
    deliveryUrl: z.string().url(),
    otpExpiresAt: z.string().datetime({ offset: true }),
    createdAt: z.string().datetime({ offset: true }),
  })
  .strict();
export type SafeDeliveryReceipt = z.infer<typeof safeDeliveryReceiptSchema>;

export const safeOperationReceiptSchema = z
  .object({
    operationId: z.string().min(1),
    requestId: z.string().min(1),
    auditEventId: z.string().min(1).optional(),
    result: z.enum(["succeeded", "failed", "rejected"]),
    delivery: safeDeliveryReceiptSchema.optional(),
  })
  .strict();
export type SafeOperationReceipt = z.infer<typeof safeOperationReceiptSchema>;

export const idempotencyFieldsSchema = z.object({
  scopeKey: z.string().regex(/^[a-f0-9]{64}$/u),
  requestFingerprint: z.string().regex(/^[a-f0-9]{64}$/u),
  operationId: z.string().min(1),
  status: z.enum(["processing", "committed", "failed"]),
  receiptJson: z.string().optional(),
  failureCode: z.string().min(1).optional(),
  expiresAt: z.string().datetime({ offset: true }),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  schemaVersion: z.literal("1"),
});
export type IdempotencyFields = z.infer<typeof idempotencyFieldsSchema>;

export interface PersistedDeliveryGrant {
  recordId: string;
  fields: DeliveryGrantFields;
}

export interface PersistedIdempotencyRecord {
  recordId: string;
  fields: IdempotencyFields;
}
