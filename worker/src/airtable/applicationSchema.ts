import { z } from "zod";

export const environmentSchema = z.enum(["test", "production"]);
export const credentialStateSchema = z.enum([
  "no_credentials",
  "active",
  "suspended",
  "rotated_inactive",
  "revoked",
]);

export const institutionFieldsSchema = z.object({
  institutionId: z.string().min(1),
  name: z.string().min(1),
  searchName: z.string().min(1),
});
export type InstitutionFields = z.infer<typeof institutionFieldsSchema>;

export const apiRoleFieldsSchema = z.object({
  roleId: z.string().min(1),
  name: z.string().min(1),
  serviceIdentifiers: z.array(z.string()).default([]),
});
export type ApiRoleFields = z.infer<typeof apiRoleFieldsSchema>;

export const applicationFieldsSchema = z.object({
  applicationId: z.string().min(1),
  name: z.string().min(1),
  searchName: z.string().min(1),
  institutionId: z.string().min(1),
  environment: environmentSchema,
  roleId: z.string().min(1),
  declaredIps: z.string(),
  technicalContact: z.string().optional(),
  managementReason: z.string().max(500).optional(),
  requestOrTicketId: z.string().max(100).optional(),
  credentialState: credentialStateSchema,
  currentCredentialId: z.string().min(1).optional(),
  lastChangedAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});
export type ApplicationFields = z.infer<typeof applicationFieldsSchema>;

export const technicalContactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().optional(),
  phone: z.string().trim().min(1).max(40).optional(),
});

export const managementCommandSchema = z
  .object({
    technicalContact: technicalContactSchema.optional(),
    reason: z.string().trim().max(500).optional(),
    requestOrTicketId: z.string().trim().max(100).optional(),
  })
  .strict();
export type ManagementCommand = z.infer<typeof managementCommandSchema>;

export const integratedApplicationSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    institution: z
      .object({ id: z.string().min(1), name: z.string().min(1) })
      .strict(),
    environment: environmentSchema,
    apiRole: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        serviceIdentifiers: z.array(z.string()),
      })
      .strict(),
    declaredIps: z.array(z.string()),
    management: z
      .object({
        technicalContact: technicalContactSchema.optional(),
        reason: z.string().optional(),
        requestOrTicketId: z.string().optional(),
        updatedAt: z.string().datetime({ offset: true }).optional(),
      })
      .strict(),
    credentialState: credentialStateSchema,
    stateHistory: z.array(z.record(z.string(), z.unknown())),
    lastChangedAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();
export type IntegratedApplication = z.infer<typeof integratedApplicationSchema>;

export interface ApplicationPage {
  items: IntegratedApplication[];
  page: number;
  pageSize: 20;
  total: number;
}
