import { z } from "zod";

export const permissionValues = [
  "applications:read",
  "credentials:issue",
  "credentials:regenerate",
  "credentials:deliver",
  "credentials:suspend",
  "credentials:reactivate",
  "credentials:revoke",
  "management:write",
  "usage:read",
  "audit:read",
  "users:write",
] as const;

export const permissionSchema = z.enum(permissionValues);
export type Permission = z.infer<typeof permissionSchema>;

export const userFieldsSchema = z.object({
  userId: z.string().min(1),
  loginIdentifier: z.string().min(1),
  displayName: z.string().min(1),
  profile: z.enum(["analyst", "senior_analyst", "administrator", "auditor"]),
  enabled: z.boolean(),
  permissions: z.array(permissionSchema).default([]),
  institutionIds: z.array(z.string().min(1)).optional(),
  updatedAt: z.string().optional(),
  corporateIssuer: z.string().url().optional(),
  corporateSubject: z.string().min(1).optional(),
  identityValidatedAt: z.string().optional(),
});

export type UserFields = z.infer<typeof userFieldsSchema>;

export interface AuthorizedUser {
  id: string;
  loginIdentifier: string;
  displayName: string;
  profile: UserFields["profile"];
  enabled: boolean;
  permissions: Permission[];
  institutionIds?: string[];
  updatedAt?: string;
  corporateIssuer?: string;
  corporateSubject?: string;
  identityValidatedAt?: string;
}
