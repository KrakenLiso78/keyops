import { z } from 'zod';
import { contractVersionSchema } from './common';
export const errorSchema = z.object({
  contractVersion: contractVersionSchema,
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.string().min(1),
  retryable: z.boolean().default(false),
});
export type ApiErrorBody = z.infer<typeof errorSchema>;
