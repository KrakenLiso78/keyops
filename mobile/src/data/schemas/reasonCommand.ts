import { z } from 'zod';
export const reasonCommandSchema = z.object({ reason: z.string().trim().min(1).max(500) });
