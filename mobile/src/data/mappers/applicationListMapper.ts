import { applicationPageSchema } from '@/data/schemas/applicationList';

export const mapApplicationPage = (input: unknown) => applicationPageSchema.parse(input);
