import { z } from 'zod';

export const userProfileSchema = z.enum(['analyst', 'senior_analyst', 'administrator', 'auditor']);

export const userCommandSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  loginIdentifier: z.string().trim().min(2).max(80),
  profile: userProfileSchema,
  enabled: z.boolean().default(true),
});

const permissionSchema = z.enum([
  'applications:read',
  'credentials:issue',
  'credentials:regenerate',
  'credentials:deliver',
  'credentials:suspend',
  'credentials:reactivate',
  'credentials:revoke',
  'management:write',
  'usage:read',
  'audit:read',
  'users:write',
]);

export const authorizedUserSchema = z
  .object({
    id: z.string().min(1),
    corporateIssuer: z.string().url(),
    corporateSubject: z.string().min(1),
    displayName: z.string().min(1),
    profile: userProfileSchema,
    enabled: z.boolean(),
    permissions: z.array(permissionSchema),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const authorizedUsersSchema = z.array(authorizedUserSchema);

export const registerAuthorizedUserSchema = z
  .object({
    corporateIssuer: z
      .string()
      .url()
      .refine((value) => value.startsWith('https://')),
    corporateSubject: z.string().trim().min(1).max(255),
    profile: userProfileSchema,
    enabled: z.boolean(),
  })
  .strict();

export const updateAuthorizedUserSchema = z
  .object({ profile: userProfileSchema, enabled: z.boolean() })
  .strict();
