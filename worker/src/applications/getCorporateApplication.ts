import type { AuthorizedUser } from "../airtable/userSchema";
import { authorize } from "../auth/authorize";
import { catalogCacheKey } from "../cache/catalogCache";
import { ApiError } from "../http/ApiError";
import { joinOperationalContext } from "./joinOperationalContext";
import {
  inScope,
  requireCatalog,
  type CorporateApplicationDependencies,
} from "./listCorporateApplications";

export async function getCorporateApplication(
  user: AuthorizedUser,
  dependencies: CorporateApplicationDependencies,
  environment: "test" | "production",
  applicationId: string,
) {
  authorize(user, "applications:read");
  const catalog = requireCatalog(dependencies.catalog);
  let application;
  try {
    application = await dependencies.catalogCache.getOrLoad(
      catalogCacheKey({
        actorUserId: user.id,
        institutionScope: user.institutionIds,
        environment,
        query: `detail:${applicationId}`,
      }),
      () =>
        catalog.get({
          externalApplicationId: applicationId,
          environment,
          scope: {
            actorUserId: user.id,
            allowedInstitutionIds: user.institutionIds,
          },
        }),
    );
  } catch (error) {
    if (
      error instanceof ApiError &&
      error.code === "catalog_application_not_found"
    ) {
      throw new ApiError(
        404,
        "application_not_found",
        "No se encontró la aplicación solicitada.",
      );
    }
    throw error;
  }
  if (
    application.externalApplicationId !== applicationId ||
    application.environment !== environment ||
    !inScope(user, application)
  ) {
    throw new ApiError(
      404,
      "application_not_found",
      "No se encontró la aplicación solicitada.",
    );
  }
  if (!application.active) {
    throw new ApiError(
      409,
      "catalog_application_inactive",
      "La aplicación corporativa no está vigente.",
    );
  }
  const [context, credentials, versions, realReferences] = await Promise.all([
    dependencies.contexts.get(environment, applicationId),
    dependencies.credentials.listCredentials(),
    dependencies.credentials.listVersions(),
    dependencies.realReferences?.listReferences() ?? [],
  ]);
  return joinOperationalContext({
    catalog: [application],
    contexts: context ? [context] : [],
    credentials,
    versions,
    realReferences,
  })[0]!;
}
