import { z } from 'zod';
import { contractVersionSchema, environmentSchema } from './common';
export const applicationListItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  institution: z.string().min(1),
  environment: environmentSchema,
  credentialState: z.enum(['no_credentials', 'active', 'suspended', 'rotated_inactive', 'revoked']),
  lastChangedAt: z.string().datetime({ offset: true }),
});
export const applicationPageSchema = z.object({
  contractVersion: contractVersionSchema,
  items: z.array(applicationListItemSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().min(0),
});
