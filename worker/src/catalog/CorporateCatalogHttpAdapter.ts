import { ApiError } from "../http/ApiError";
import type {
  CatalogScope,
  CorporateCatalogApplication,
  CorporateCatalogPort,
} from "./CorporateCatalogPort";
import { catalogApplicationSchema, catalogPageSchema } from "./catalogSchemas";

export class CorporateCatalogHttpAdapter implements CorporateCatalogPort {
  constructor(
    private readonly config: { baseUrl: string; readToken: string },
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async list(input: Parameters<CorporateCatalogPort["list"]>[0]) {
    const url = new URL(`${this.config.baseUrl}/applications`);
    url.searchParams.set("environment", input.environment);
    if (input.query) url.searchParams.set("query", input.query);
    if (input.cursor) url.searchParams.set("cursor", input.cursor);
    const parsed = catalogPageSchema.safeParse(
      await this.request(url, input.scope, input.signal),
    );
    if (!parsed.success) throw invalidCatalogData();
    return parsed.data;
  }

  async get(
    input: Parameters<CorporateCatalogPort["get"]>[0],
  ): Promise<CorporateCatalogApplication> {
    const url = new URL(
      `${this.config.baseUrl}/applications/${encodeURIComponent(input.externalApplicationId)}`,
    );
    url.searchParams.set("environment", input.environment);
    const parsed = catalogApplicationSchema.safeParse(
      await this.request(url, input.scope, input.signal),
    );
    if (!parsed.success) throw invalidCatalogData();
    return parsed.data;
  }

  private async request(
    url: URL,
    scope: CatalogScope,
    signal?: AbortSignal,
  ): Promise<unknown> {
    let response: Response;
    try {
      response = await this.fetcher(url, {
        method: "GET",
        signal,
        headers: {
          accept: "application/json",
          authorization: `Bearer ${this.config.readToken}`,
          "x-keyops-actor-id": scope.actorUserId,
          ...(scope.allowedInstitutionIds
            ? {
                "x-keyops-institution-scope":
                  scope.allowedInstitutionIds.join(","),
              }
            : {}),
        },
      });
    } catch {
      throw new ApiError(
        503,
        "catalog_unavailable",
        "El catálogo corporativo no está disponible.",
        true,
      );
    }
    if (!response.ok) {
      if (response.status === 404) {
        throw new ApiError(
          404,
          "catalog_application_not_found",
          "No se encontró la aplicación corporativa solicitada.",
        );
      }
      const status =
        response.status === 401 || response.status === 403 ? 403 : 503;
      throw new ApiError(
        status,
        status === 403 ? "catalog_forbidden" : "catalog_unavailable",
        status === 403
          ? "El catálogo rechazó el alcance solicitado."
          : "El catálogo corporativo no está disponible.",
        status === 503,
      );
    }
    try {
      return await response.json();
    } catch {
      throw new ApiError(
        503,
        "invalid_catalog_data",
        "El catálogo devolvió datos no válidos.",
      );
    }
  }
}

function invalidCatalogData() {
  return new ApiError(
    503,
    "invalid_catalog_data",
    "El catálogo devolvió datos no válidos.",
  );
}
