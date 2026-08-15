import type { AuthorizedUser } from "../airtable/userSchema";
import type { ApplicationOperationalContextRepository } from "../airtable/ApplicationOperationalContextRepository";
import type { CredentialRepository } from "../airtable/CredentialRepository";
import type { ApplicationListQuery } from "../airtable/ApplicationRepository";
import type {
  CorporateCatalogApplication,
  CorporateCatalogPort,
} from "../catalog/CorporateCatalogPort";
import { CatalogCache, catalogCacheKey } from "../cache/catalogCache";
import { authorize } from "../auth/authorize";
import { applicationSearchText, normalizeSearch } from "./normalizeSearch";
import { joinOperationalContext } from "./joinOperationalContext";
import { ApiError } from "../http/ApiError";
import type { RealCredentialReferenceRepository } from "../airtable/RealCredentialReferenceRepository";

export interface CorporateApplicationDependencies {
  catalog?: CorporateCatalogPort;
  catalogCache: CatalogCache;
  contexts: Pick<
    ApplicationOperationalContextRepository,
    "list" | "get" | "saveManagement"
  >;
  credentials: Pick<CredentialRepository, "listCredentials" | "listVersions">;
  realReferences?: Pick<RealCredentialReferenceRepository, "listReferences">;
}

function requireCatalog(catalog?: CorporateCatalogPort): CorporateCatalogPort {
  if (!catalog) {
    throw new ApiError(
      503,
      "catalog_not_configured",
      "El catálogo corporativo no está configurado.",
    );
  }
  return catalog;
}

function inScope(
  user: AuthorizedUser,
  application: CorporateCatalogApplication,
) {
  return (
    !user.institutionIds ||
    user.institutionIds.includes(application.externalInstitutionId)
  );
}

export async function listCorporateApplications(
  user: AuthorizedUser,
  dependencies: CorporateApplicationDependencies,
  query: ApplicationListQuery,
) {
  authorize(user, "applications:read");
  const catalog = requireCatalog(dependencies.catalog);
  const scope = {
    actorUserId: user.id,
    allowedInstitutionIds: user.institutionIds,
  };
  const items: CorporateCatalogApplication[] = [];
  const cursors = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await dependencies.catalogCache.getOrLoad(
      catalogCacheKey({
        actorUserId: user.id,
        institutionScope: user.institutionIds,
        environment: query.environment,
        query: query.query,
        cursor,
      }),
      () =>
        catalog.list({
          environment: query.environment,
          query: query.query,
          cursor,
          scope,
        }),
    );
    items.push(...page.items);
    cursor = page.nextCursor;
    if (cursor && cursors.has(cursor)) {
      throw new ApiError(
        503,
        "invalid_catalog_pagination",
        "El catálogo devolvió una paginación no válida.",
      );
    }
    if (cursor) cursors.add(cursor);
  } while (cursor);

  const current = items.filter(
    (application) =>
      application.active &&
      application.environment === query.environment &&
      inScope(user, application),
  );
  const catalogKeys = new Set(
    current.map(
      (application) =>
        `${application.environment}:${application.externalApplicationId}`,
    ),
  );
  const [contexts, credentials, versions, realReferences] = await Promise.all([
    dependencies.contexts.list(),
    dependencies.credentials.listCredentials(),
    dependencies.credentials.listVersions(),
    dependencies.realReferences?.listReferences() ?? [],
  ]);
  const joined = joinOperationalContext({
    catalog: current,
    contexts: contexts.filter(({ fields }) =>
      catalogKeys.has(`${fields.environment}:${fields.catalogApplicationId}`),
    ),
    credentials,
    versions,
    realReferences,
  });
  const search = normalizeSearch(query.query ?? "");
  const filtered = joined
    .filter(
      (application) =>
        !query.state || application.credentialState === query.state,
    )
    .filter(
      (application) =>
        !search ||
        applicationSearchText({
          name: application.name,
          institution: application.institution.name,
          role: application.apiRole.name,
          credentialState: application.credentialState,
          declaredIps: application.declaredIps,
          contact: application.management.technicalContact,
          requestOrTicketId: application.management.requestOrTicketId,
        }).includes(search),
    )
    .toSorted((left, right) => {
      if (query.sort === "lastChangedAt") {
        return (
          right.lastChangedAt.localeCompare(left.lastChangedAt) ||
          left.name.localeCompare(right.name, "es")
        );
      }
      if (query.sort === "institution") {
        return (
          left.institution.name.localeCompare(right.institution.name, "es", {
            sensitivity: "base",
          }) || left.name.localeCompare(right.name, "es")
        );
      }
      return left.name.localeCompare(right.name, "es", {
        sensitivity: "base",
      });
    });
  const page = query.page ?? 1;
  const start = (page - 1) * 20;
  return {
    items: filtered.slice(start, start + 20),
    page,
    pageSize: 20 as const,
    total: filtered.length,
  };
}

export { inScope, requireCatalog };
