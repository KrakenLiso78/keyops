import { z } from 'zod';

export const managementContextPatchSchema = z
  .object({
    technicalContact: z
      .object({
        name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().optional(),
        phone: z.string().trim().min(2).max(40).optional(),
      })
      .optional(),
    reason: z.string().trim().max(500).optional(),
    requestOrTicketId: z.string().trim().max(100).optional(),
  })
  .strict();

export type ManagementContextPatch = z.infer<typeof managementContextPatchSchema>;
