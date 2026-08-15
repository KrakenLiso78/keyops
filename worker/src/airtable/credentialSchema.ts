import { z } from "zod";
import { environmentSchema } from "./applicationSchema";

export const credentialStateSchema = z.enum(["active", "suspended", "revoked"]);
export type CredentialState = z.infer<typeof credentialStateSchema>;
export const credentialVersionStateSchema = z.enum([
  "pending",
  "active",
  "suspended",
  "rotated_inactive",
  "revoked",
]);
export type CredentialVersionState = z.infer<
  typeof credentialVersionStateSchema
>;

export const credentialFieldsSchema = z.object({
  credentialId: z.string().min(1),
  applicationId: z.string().min(1),
  environment: environmentSchema,
  syntheticClientId: z.string().startsWith("synthetic_"),
  currentVersionId: z.string().min(1),
  state: credentialStateSchema,
  operationId: z.string().min(1),
  lastChangedAt: z.string().datetime({ offset: true }),
  schemaVersion: z.literal("1"),
});
export type CredentialFields = z.infer<typeof credentialFieldsSchema>;

export const credentialVersionFieldsSchema = z.object({
  versionId: z.string().min(1),
  credentialId: z.string().min(1),
  sequence: z.number().int().positive(),
  previousVersionId: z.string().min(1).optional(),
  state: credentialVersionStateSchema,
  operationId: z.string().min(1),
  reason: z.string().trim().min(1).max(500).optional(),
  createdAt: z.string().datetime({ offset: true }),
  stateChangedAt: z.string().datetime({ offset: true }),
  schemaVersion: z.literal("1"),
});
export type CredentialVersionFields = z.infer<
  typeof credentialVersionFieldsSchema
>;

export interface PersistedCredential {
  recordId: string;
  fields: CredentialFields;
}

export interface PersistedCredentialVersion {
  recordId: string;
  fields: CredentialVersionFields;
}

export interface CredentialAggregate {
  credential: PersistedCredential;
  versions: PersistedCredentialVersion[];
}
