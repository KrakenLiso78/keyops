import { userCommandSchema } from '@/data/schemas/user';

export const mapUserCommand = (input: unknown) => userCommandSchema.parse(input);
