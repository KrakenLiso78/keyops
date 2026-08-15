import { z } from "zod";
import { environmentSchema } from "../airtable/applicationSchema";

const stableIdentifier = z.string().trim().min(1).max(200);

export const catalogApplicationSchema = z
  .object({
    externalApplicationId: stableIdentifier,
    name: z.string().trim().min(1).max(200),
    externalInstitutionId: stableIdentifier,
    institutionName: z.string().trim().min(1).max(200),
    externalRoleId: stableIdentifier,
    roleName: z.string().trim().min(1).max(200),
    environment: environmentSchema,
    active: z.boolean(),
    recordVersion: stableIdentifier,
    updatedAt: z.string().datetime({ offset: true }),
  })
  .strict();

export const catalogPageSchema = z
  .object({
    items: z.array(catalogApplicationSchema),
    nextCursor: z.string().min(1).max(500).optional(),
  })
  .strict()
  .superRefine(({ items }, context) => {
    const seen = new Set<string>();
    for (const [index, item] of items.entries()) {
      const key = `${item.environment}:${item.externalApplicationId}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "externalApplicationId"],
          message: "Duplicate corporate application identifier.",
        });
      }
      seen.add(key);
    }
  });
