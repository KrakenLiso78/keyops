import { sessionResponseSchema } from '@/data/schemas/session';

export const mapSessionResponse = (input: unknown) => sessionResponseSchema.parse(input);
