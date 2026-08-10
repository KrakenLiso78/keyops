import { usageSchema } from '@/data/schemas/usage';

export const mapUsage = (input: unknown) => usageSchema.parse(input);
