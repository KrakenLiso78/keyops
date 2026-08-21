import {
  apiRoleFieldsSchema,
  applicationFieldsSchema,
  institutionFieldsSchema,
  type ApiRoleFields,
  type ApplicationFields,
  type InstitutionFields,
} from "../airtable/applicationSchema";
import type {
  AirtableClient,
  AirtableRecord,
} from "../airtable/AirtableClient";
import { normalizeSearch } from "../applications/normalizeSearch";
import { ApiError } from "../http/ApiError";
import {
  type CorporateCatalogApplication,
  type CorporateCatalogPort,
} from "./CorporateCatalogPort";
import { catalogApplicationSchema } from "./catalogSchemas";

type CatalogClient = Pick<AirtableClient, "list">;

function indexed<T extends { id: string }>(items: T[], label: string) {
  const result = new Map<string, T>();
  for (const item of items) {
    if (result.has(item.id)) {
      throw new ApiError(
        409,
        "duplicate_reference",
        `${label} contiene identificadores duplicados.`,
      );
    }
    result.set(item.id, item);
  }
  return result;
}

function isInScope(
  application: CorporateCatalogApplication,
  institutionIds?: readonly string[],
) {
  return (
    !institutionIds ||
    institutionIds.includes(application.externalInstitutionId)
  );
}

/** Uses the persisted Airtable demo catalog; resets are explicit, never implicit. */
export class AirtableDemoCatalogAdapter implements CorporateCatalogPort {
  constructor(private readonly client: CatalogClient) {}

  async list(input: Parameters<CorporateCatalogPort["list"]>[0]) {
    const applications = await this.readAll();
    const search = normalizeSearch(input.query ?? "");
    return {
      items: applications.filter(
        (application) =>
          application.environment === input.environment &&
          isInScope(application, input.scope.allowedInstitutionIds) &&
          (!search ||
            normalizeSearch(
              `${application.name} ${application.institutionName} ${application.roleName}`,
            ).includes(search)),
      ),
    };
  }

  async get(
    input: Parameters<CorporateCatalogPort["get"]>[0],
  ): Promise<CorporateCatalogApplication> {
    const page = await this.list({
      environment: input.environment,
      scope: input.scope,
      signal: input.signal,
    });
    const application = page.items.find(
      (candidate) =>
        candidate.externalApplicationId === input.externalApplicationId,
    );
    if (!application) {
      throw new ApiError(
        404,
        "catalog_application_not_found",
        "No se encontró la aplicación de demostración solicitada.",
      );
    }
    return application;
  }

  private async readAll(): Promise<CorporateCatalogApplication[]> {
    const [applicationRecords, institutionRecords, roleRecords] =
      await Promise.all([
        this.client.list<ApplicationFields>("Applications"),
        this.client.list<InstitutionFields>("Institutions"),
        this.client.list<ApiRoleFields>("ApiRoles"),
      ]);
    const institutions = indexed(
      institutionRecords.map((record) => {
        const fields = institutionFieldsSchema.parse(record.fields);
        return { id: fields.institutionId, name: fields.name };
      }),
      "Institutions",
    );
    const roles = indexed(
      roleRecords.map((record) => {
        const fields = apiRoleFieldsSchema.parse(record.fields);
        return { id: fields.roleId, name: fields.name };
      }),
      "ApiRoles",
    );
    const seen = new Set<string>();
    return applicationRecords.map((record) => {
      const fields = applicationFieldsSchema.parse(record.fields);
      if (seen.has(fields.applicationId)) {
        throw new ApiError(
          409,
          "duplicate_application",
          "Applications contiene identificadores duplicados.",
        );
      }
      seen.add(fields.applicationId);
      const institution = institutions.get(fields.institutionId);
      const role = roles.get(fields.roleId);
      if (!institution || !role) {
        throw new ApiError(
          503,
          "invalid_persisted_data",
          "La aplicación de demostración contiene una referencia inválida.",
        );
      }
      return catalogApplicationSchema.parse({
        externalApplicationId: fields.applicationId,
        name: fields.name,
        externalInstitutionId: institution.id,
        institutionName: institution.name,
        externalRoleId: role.id,
        roleName: role.name,
        environment: fields.environment,
        active: true,
        recordVersion: fields.updatedAt,
        updatedAt: fields.updatedAt,
      });
    });
  }
}
