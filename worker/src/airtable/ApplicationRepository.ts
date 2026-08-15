import {
  applicationSearchText,
  normalizeSearch,
} from "../applications/normalizeSearch";
import { ApiError } from "../http/ApiError";
import type { AirtableClient } from "./AirtableClient";
import { mapApplications } from "./applicationMapper";
import type {
  ApiRoleFields,
  ApplicationFields,
  ApplicationPage,
  InstitutionFields,
  IntegratedApplication,
  ManagementCommand,
} from "./applicationSchema";

export interface ApplicationListQuery {
  environment: "test" | "production";
  query?: string;
  state?: ApplicationFields["credentialState"];
  sort?: "name" | "lastChangedAt";
  page?: number;
}

export class ApplicationRepository {
  constructor(
    private readonly client: Pick<AirtableClient, "list" | "update">,
  ) {}

  async list(query: ApplicationListQuery): Promise<ApplicationPage> {
    const applications = await this.readAll();
    const search = normalizeSearch(query.query ?? "");
    const filtered = applications.filter((application) => {
      if (application.environment !== query.environment) return false;
      if (query.state && application.credentialState !== query.state)
        return false;
      if (!search) return true;
      return applicationSearchText({
        name: application.name,
        institution: application.institution.name,
        role: application.apiRole.name,
        credentialState: application.credentialState,
        declaredIps: application.declaredIps,
        contact: application.management.technicalContact,
        requestOrTicketId: application.management.requestOrTicketId,
      }).includes(search);
    });
    const sorted = filtered.toSorted((left, right) => {
      if (query.sort === "lastChangedAt") {
        return (
          right.lastChangedAt.localeCompare(left.lastChangedAt) ||
          left.name.localeCompare(right.name, "es")
        );
      }
      return left.name.localeCompare(right.name, "es", { sensitivity: "base" });
    });
    const page = query.page ?? 1;
    const start = (page - 1) * 20;
    return {
      items: sorted.slice(start, start + 20),
      page,
      pageSize: 20,
      total: sorted.length,
    };
  }

  async get(
    environment: "test" | "production",
    applicationId: string,
  ): Promise<IntegratedApplication> {
    const matches = (await this.readAll()).filter(
      (application) =>
        application.id === applicationId &&
        application.environment === environment,
    );
    if (matches.length !== 1) {
      throw new ApiError(
        404,
        "application_not_found",
        "No se encontró la aplicación solicitada.",
      );
    }
    return matches[0]!;
  }

  async updateManagement(
    environment: "test" | "production",
    applicationId: string,
    expectedUpdatedAt: string,
    command: ManagementCommand,
    now = new Date().toISOString(),
  ): Promise<IntegratedApplication> {
    const records = await this.client.list<ApplicationFields>("Applications");
    const record = records.find(
      ({ fields }) =>
        fields.applicationId === applicationId &&
        fields.environment === environment,
    );
    if (!record)
      throw new ApiError(
        404,
        "application_not_found",
        "No se encontró la aplicación solicitada.",
      );
    if (record.fields.updatedAt !== expectedUpdatedAt) {
      throw new ApiError(
        409,
        "stale_application",
        "La aplicación ha cambiado; vuelve a cargarla.",
      );
    }
    await this.client.update<ApplicationFields>("Applications", record.id, {
      technicalContact: command.technicalContact
        ? JSON.stringify({
            displayName: command.technicalContact.name,
            email: command.technicalContact.email,
            phone: command.technicalContact.phone,
          })
        : undefined,
      managementReason: command.reason,
      requestOrTicketId: command.requestOrTicketId,
      updatedAt: now,
    });
    return this.get(environment, applicationId);
  }

  private async readAll(): Promise<IntegratedApplication[]> {
    const [applications, institutions, roles] = await Promise.all([
      this.client.list<ApplicationFields>("Applications"),
      this.client.list<InstitutionFields>("Institutions"),
      this.client.list<ApiRoleFields>("ApiRoles"),
    ]);
    return mapApplications(applications, institutions, roles);
  }
}
