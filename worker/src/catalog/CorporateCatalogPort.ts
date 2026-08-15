import type { z } from "zod";
import type {
  catalogApplicationSchema,
  catalogPageSchema,
} from "./catalogSchemas";

export type CorporateCatalogApplication = z.infer<
  typeof catalogApplicationSchema
>;
export type CorporateCatalogPage = z.infer<typeof catalogPageSchema>;

export interface CatalogScope {
  actorUserId: string;
  allowedInstitutionIds?: readonly string[];
}

export interface CorporateCatalogPort {
  list(input: {
    environment: "test" | "production";
    query?: string;
    cursor?: string;
    scope: CatalogScope;
    signal?: AbortSignal;
  }): Promise<CorporateCatalogPage>;
  get(input: {
    externalApplicationId: string;
    environment: "test" | "production";
    scope: CatalogScope;
    signal?: AbortSignal;
  }): Promise<CorporateCatalogApplication>;
}
