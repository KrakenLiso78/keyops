import { z } from "zod";
import { environmentSchema } from "../../airtable/applicationSchema";

export const realCredentialStateSchema = z.enum([
  "active",
  "suspended",
  "revoked",
]);

export const providerCredentialSnapshotSchema = z
  .object({
    externalCredentialId: z.string().min(1),
    externalVersionId: z.string().min(1),
    previousExternalVersionId: z.string().min(1).optional(),
    effectiveState: realCredentialStateSchema,
    sealedDeliveryHandle: z.string().min(1).optional(),
    confirmedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const providerOperationResultSchema = z
  .object({
    providerOperationId: z.string().min(1),
    status: z.enum(["processing", "confirmed", "failed"]),
    failureCode: z.string().min(1).optional(),
    credential: providerCredentialSnapshotSchema.optional(),
  })
  .strict();

export const acceptanceProbeSchema = z
  .object({
    externalCredentialId: z.string().min(1),
    externalVersionId: z.string().min(1),
    accepted: z.boolean(),
    checkedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const safeDeliveryReferenceSchema = z
  .object({
    deliveryId: z.string().min(1),
    expiresAt: z.string().datetime({ offset: true }),
    passwordChannelId: z.string().min(1),
    otpChannelId: z.string().min(1),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.passwordChannelId === value.otpChannelId) {
      context.addIssue({
        code: "custom",
        path: ["otpChannelId"],
        message: "Password and OTP channels must be different.",
      });
    }
  });

export const realCredentialReferenceFieldsSchema = z.object({
  referenceId: z.string().min(1),
  externalCredentialId: z.string().min(1),
  catalogApplicationId: z.string().min(1),
  environment: environmentSchema,
  externalVersionId: z.string().min(1),
  effectiveState: z.enum([
    "active",
    "suspended",
    "revoked",
    "reconciliation_required",
  ]),
  lastOperationId: z.string().min(1),
  lastConfirmedAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
  sealedDeliveryHandle: z.string().min(1).optional(),
  schemaVersion: z.literal("2"),
});
export type RealCredentialReferenceFields = z.infer<
  typeof realCredentialReferenceFieldsSchema
>;

export const realOperationReceiptFieldsSchema = z.object({
  operationId: z.string().min(1),
  providerOperationId: z.string().min(1),
  idempotencyScopeHash: z.string().regex(/^[a-f0-9]{64}$/u),
  requestFingerprint: z.string().regex(/^[a-f0-9]{64}$/u),
  requestId: z.string().min(1),
  actorUserId: z.string().min(1),
  catalogApplicationId: z.string().min(1),
  environment: environmentSchema,
  referenceId: z.string().min(1).optional(),
  action: z.enum(["issue", "rotate", "suspend", "reactivate", "revoke"]),
  status: z.enum(["pending", "confirmed", "reconciliation_required"]),
  result: z.enum(["pending", "succeeded", "failed", "rejected"]),
  deliveryReferenceId: z.string().min(1).optional(),
  deliveryExpiresAt: z.string().datetime({ offset: true }).optional(),
  auditEventId: z.string().min(1).optional(),
  failureCode: z.string().min(1).optional(),
  createdAt: z.string().datetime({ offset: true }),
  confirmedAt: z.string().datetime({ offset: true }).optional(),
  updatedAt: z.string().datetime({ offset: true }),
  schemaVersion: z.literal("2"),
});
export type RealOperationReceiptFields = z.infer<
  typeof realOperationReceiptFieldsSchema
>;

export const realOperationReceiptSchema = z
  .object({
    operationId: z.string().min(1),
    requestId: z.string().min(1),
    status: z.enum(["confirmed", "reconciliation_required"]),
    result: z.enum(["succeeded", "failed", "rejected"]),
    auditEventId: z.string().min(1).optional(),
    delivery: z
      .object({
        deliveryId: z.string().min(1),
        expiresAt: z.string().datetime({ offset: true }),
      })
      .strict()
      .optional(),
  })
  .strict();
export type RealOperationReceipt = z.infer<typeof realOperationReceiptSchema>;
