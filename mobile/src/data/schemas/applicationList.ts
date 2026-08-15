import { z } from 'zod';
import { apiApplicationSchema } from './applicationDetail';
import { contractVersionSchema } from './common';

export const applicationPageSchema = z.object({
  contractVersion: contractVersionSchema,
  items: z.array(apiApplicationSchema),
  page: z.number().int().min(1),
  pageSize: z.literal(20),
  total: z.number().int().min(0),
});
