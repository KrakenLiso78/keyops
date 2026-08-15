import { sessionResponseSchema, sessionViewSchema } from '@/data/schemas/session';

export const mapSessionResponse = (input: unknown) => sessionResponseSchema.parse(input);
export const mapSessionView = (input: unknown) => sessionViewSchema.parse(input).user;
