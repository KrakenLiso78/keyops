import { z } from 'zod';

export const userProfileSchema = z.enum(['analyst', 'senior_analyst', 'administrator', 'auditor']);

export const userCommandSchema = z.object({
  displayName: z.string().trim().min(2).max(120),
  loginIdentifier: z.string().trim().min(2).max(80),
  profile: userProfileSchema,
  enabled: z.boolean().default(true),
});
