import { z } from 'zod';

export const managementContextPatchSchema = z.object({
  technicalContact: z.string().trim().min(2).max(120).optional(),
  requestOrTicketId: z.string().trim().min(2).max(80).optional(),
});

export type ManagementContextPatch = z.infer<typeof managementContextPatchSchema>;
