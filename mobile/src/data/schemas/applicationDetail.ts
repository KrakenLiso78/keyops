import { z } from 'zod';
import { contractVersionSchema, environmentSchema } from './common';

const credentialStateSchema = z.enum([
  'no_credentials',
  'active',
  'suspended',
  'rotated_inactive',
  'revoked',
]);

export const apiApplicationSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    institution: z.object({ id: z.string().min(1), name: z.string().min(1) }).strict(),
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
        technicalContact: z
          .object({
            name: z.string().min(1),
            email: z.string().email().optional(),
            phone: z.string().optional(),
          })
          .strict()
          .optional(),
        reason: z.string().optional(),
        requestOrTicketId: z.string().optional(),
        updatedAt: z.string().datetime({ offset: true }).optional(),
      })
      .strict(),
    credentialState: credentialStateSchema,
    stateHistory: z.array(z.record(z.string(), z.unknown())),
    clientId: z.string().optional(),
    lastChangedAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const applicationDetailResponseSchema = z.object({
  contractVersion: contractVersionSchema,
  application: apiApplicationSchema,
});
