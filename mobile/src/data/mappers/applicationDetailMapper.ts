import { applicationDetailSchema } from '@/data/schemas/applicationDetail';

export const mapApplicationDetail = (input: unknown) => applicationDetailSchema.parse(input);
