import { z } from 'zod';
import { applicationListItemSchema } from './applicationList';
import { contractVersionSchema } from './common';
export const applicationDetailSchema = applicationListItemSchema.extend({
  apiRole: z.string().min(1),
  declaredIps: z.array(z.string()),
  technicalContact: z.string().optional(),
  requestOrTicketId: z.string().optional(),
  clientId: z.string().optional(),
  messagesSent: z.number().int().nonnegative().optional(),
  consumedServices: z.array(z.string()).optional(),
  usedIps: z.array(z.string()).optional(),
  lastConsumedAt: z.string().datetime({ offset: true }).optional(),
});
export const applicationDetailResponseSchema = z.object({
  contractVersion: contractVersionSchema,
  application: applicationDetailSchema,
});
