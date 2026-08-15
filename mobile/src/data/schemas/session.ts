import { z } from 'zod';
import { permissionValues } from '@/domain/model/common';
import { contractVersionSchema, instantSchema } from './common';
const profileSchema = z.enum(['analyst', 'senior_analyst', 'administrator', 'auditor']);
export const permissionSchema = z.enum(permissionValues);
export const createSessionRequestSchema = z.object({
  loginIdentifier: z.string().min(1),
  password: z.string().min(1),
});
export const sessionUserSchema = z.object({
  id: z.string().min(1),
  loginIdentifier: z.string().min(1),
  displayName: z.string().min(1),
  profile: profileSchema,
  enabled: z.boolean(),
  permissions: z
    .array(permissionSchema)
    .refine((permissions) => new Set(permissions).size === permissions.length, {
      message: 'Los permisos no pueden estar duplicados.',
    }),
});
export const sessionResponseSchema = z.object({
  contractVersion: contractVersionSchema,
  user: sessionUserSchema,
  accessToken: z.string().min(1),
  expiresAt: instantSchema,
  refreshToken: z.string().min(1).optional(),
});
export const sessionViewSchema = z.object({
  contractVersion: contractVersionSchema,
  user: sessionUserSchema,
});
