import { ApiError } from "../http/ApiError";
import type {
  CorporateCatalogApplication,
  CorporateCatalogPort,
} from "./CorporateCatalogPort";

const applications: readonly CorporateCatalogApplication[] = [
  {
    externalApplicationId: "app-test",
    name: "Pago en Línea",
    externalInstitutionId: "inst-salud",
    institutionName: "Ministerio de Salud",
    externalRoleId: "role-mensajes",
    roleName: "Envío de mensajes",
    environment: "test",
    active: true,
    recordVersion: "demo-catalog-v1",
    updatedAt: "2026-08-15T09:00:00.000Z",
  },
  {
    externalApplicationId: "app-production",
    name: "Portal Tributario",
    externalInstitutionId: "inst-hacienda",
    institutionName: "Ministerio de Hacienda",
    externalRoleId: "role-mensajes",
    roleName: "Envío de mensajes",
    environment: "production",
    active: true,
    recordVersion: "demo-catalog-v1",
    updatedAt: "2026-08-14T09:00:00.000Z",
  },
];

function isInScope(
  application: CorporateCatalogApplication,
  institutionIds?: readonly string[],
) {
  return (
    !institutionIds ||
    institutionIds.includes(application.externalInstitutionId)
  );
}

export class DemoCatalogAdapter implements CorporateCatalogPort {
  async list(input: Parameters<CorporateCatalogPort["list"]>[0]) {
    return {
      items: applications.filter(
        (application) =>
          application.environment === input.environment &&
          isInScope(application, input.scope.allowedInstitutionIds),
      ),
    };
  }

  async get(
    input: Parameters<CorporateCatalogPort["get"]>[0],
  ): Promise<CorporateCatalogApplication> {
    const application = applications.find(
      (candidate) =>
        candidate.externalApplicationId === input.externalApplicationId &&
        candidate.environment === input.environment &&
        isInScope(candidate, input.scope.allowedInstitutionIds),
    );
    if (!application) {
      throw new ApiError(
        404,
        "catalog_application_not_found",
        "No se encontró la aplicación corporativa solicitada.",
      );
    }
    return application;
  }
}
