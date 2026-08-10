import { auditPageSchema } from '@/data/schemas/auditList';

export const mapAuditPage = (input: unknown) => auditPageSchema.parse(input);
