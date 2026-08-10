import { managementContextPatchSchema } from '@/data/schemas/managementContext';

export const mapManagementContextPatch = (input: unknown) =>
  managementContextPatchSchema.parse(input);
