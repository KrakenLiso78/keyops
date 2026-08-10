import { z } from 'zod';

export const usageSchema = z.object({
  applicationId: z.string().min(1),
  environment: z.enum(['test', 'production']),
  availability: z.enum(['available', 'no_data', 'unavailable']),
  messagesSent: z.number().int().nonnegative().optional(),
  consumedServices: z.array(z.string()),
  usedIps: z.array(z.string()),
  lastConsumedAt: z.string().datetime().optional(),
});
