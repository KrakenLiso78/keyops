import { z } from 'zod';
export const contractVersionSchema = z.literal('1');
export const environmentSchema = z.enum(['test', 'production']);
export const instantSchema = z.string().datetime({ offset: true });
export const entityIdSchema = z.string().trim().min(1);
export const pageSchema = <T extends z.ZodType>(item: T) =>
  z.object({
    contractVersion: contractVersionSchema,
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().min(0),
  });
