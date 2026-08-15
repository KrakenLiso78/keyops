import { ApiError } from "../http/ApiError";
import type { AirtableClient, AirtableRecord } from "./AirtableClient";
import {
  applicationFieldsSchema,
  type ApplicationFields,
} from "./applicationSchema";
import {
  credentialFieldsSchema,
  credentialVersionFieldsSchema,
  type CredentialAggregate,
  type CredentialFields,
  type CredentialVersionFields,
  type PersistedCredential,
  type PersistedCredentialVersion,
} from "./credentialSchema";

type CredentialClient = Pick<
  AirtableClient,
  "list" | "create" | "update" | "updateMany"
>;

export interface PersistedApplication {
  recordId: string;
  fields: ApplicationFields;
}

function mapCredential(
  record: AirtableRecord<CredentialFields>,
): PersistedCredential {
  return {
    recordId: record.id,
    fields: credentialFieldsSchema.parse(record.fields),
  };
}

function mapVersion(
  record: AirtableRecord<CredentialVersionFields>,
): PersistedCredentialVersion {
  return {
    recordId: record.id,
    fields: credentialVersionFieldsSchema.parse(record.fields),
  };
}

export class CredentialRepository {
  constructor(private readonly client: CredentialClient) {}

  async getApplication(
    environment: "test" | "production",
    applicationId: string,
  ): Promise<PersistedApplication> {
    const records = await this.client.list<ApplicationFields>("Applications");
    const matches = records.filter(({ fields }) => {
      const parsed = applicationFieldsSchema.parse(fields);
      return (
        parsed.applicationId === applicationId &&
        parsed.environment === environment
      );
    });
    if (matches.length !== 1) {
      throw new ApiError(
        matches.length ? 409 : 404,
        matches.length ? "duplicate_application" : "application_not_found",
        matches.length
          ? "La aplicación tiene una configuración ambigua."
          : "No se encontró la aplicación solicitada.",
      );
    }
    return {
      recordId: matches[0]!.id,
      fields: applicationFieldsSchema.parse(matches[0]!.fields),
    };
  }

  async findByApplication(
    environment: "test" | "production",
    applicationId: string,
  ): Promise<CredentialAggregate | undefined> {
    const credential = await this.findCredential(environment, applicationId);
    return credential ? this.loadAggregate(credential, true) : undefined;
  }

  async findByApplicationForReconciliation(
    environment: "test" | "production",
    applicationId: string,
  ): Promise<CredentialAggregate | undefined> {
    const credential = await this.findCredential(environment, applicationId);
    return credential ? this.loadAggregate(credential, false) : undefined;
  }

  private async findCredential(
    environment: "test" | "production",
    applicationId: string,
  ): Promise<PersistedCredential | undefined> {
    const records = await this.client.list<CredentialFields>("Credentials");
    const matches = records
      .map(mapCredential)
      .filter(
        ({ fields }) =>
          fields.applicationId === applicationId &&
          fields.environment === environment,
      );
    if (matches.length > 1) {
      throw new ApiError(
        409,
        "duplicate_credential",
        "La aplicación tiene más de una credencial sintética.",
      );
    }
    return matches[0];
  }

  async findById(
    environment: "test" | "production",
    applicationId: string,
    credentialId: string,
  ): Promise<CredentialAggregate | undefined> {
    const aggregate = await this.findByApplication(environment, applicationId);
    return aggregate?.credential.fields.credentialId === credentialId
      ? aggregate
      : undefined;
  }

  async findByIdForReconciliation(
    environment: "test" | "production",
    applicationId: string,
    credentialId: string,
  ): Promise<CredentialAggregate | undefined> {
    const aggregate = await this.findByApplicationForReconciliation(
      environment,
      applicationId,
    );
    return aggregate?.credential.fields.credentialId === credentialId
      ? aggregate
      : undefined;
  }

  async findVersionByOperation(
    operationId: string,
  ): Promise<PersistedCredentialVersion | undefined> {
    const matches = (
      await this.client.list<CredentialVersionFields>("CredentialVersions")
    )
      .map(mapVersion)
      .filter(({ fields }) => fields.operationId === operationId);
    if (matches.length > 1) {
      throw new ApiError(
        409,
        "duplicate_operation_version",
        "La operación referencia más de una versión.",
      );
    }
    return matches[0];
  }

  async createCredential(
    fields: CredentialFields,
  ): Promise<PersistedCredential> {
    return mapCredential(
      await this.client.create<CredentialFields>(
        "Credentials",
        credentialFieldsSchema.parse(fields),
      ),
    );
  }

  async createVersion(
    fields: CredentialVersionFields,
  ): Promise<PersistedCredentialVersion> {
    return mapVersion(
      await this.client.create<CredentialVersionFields>(
        "CredentialVersions",
        credentialVersionFieldsSchema.parse(fields),
      ),
    );
  }

  async updateCredential(
    recordId: string,
    fields: Partial<CredentialFields>,
  ): Promise<PersistedCredential> {
    return mapCredential(
      await this.client.update<CredentialFields>(
        "Credentials",
        recordId,
        fields,
      ),
    );
  }

  async updateVersions(
    updates: Array<{
      recordId: string;
      fields: Partial<CredentialVersionFields>;
    }>,
  ): Promise<PersistedCredentialVersion[]> {
    return (
      await this.client.updateMany<CredentialVersionFields>(
        "CredentialVersions",
        updates,
      )
    ).map(mapVersion);
  }

  async updateApplication(
    recordId: string,
    fields: Partial<ApplicationFields>,
  ): Promise<PersistedApplication> {
    const updated = await this.client.update<ApplicationFields>(
      "Applications",
      recordId,
      fields,
    );
    return {
      recordId: updated.id,
      fields: applicationFieldsSchema.parse(updated.fields),
    };
  }

  private async loadAggregate(
    credential: PersistedCredential,
    enforceInvariant: boolean,
  ): Promise<CredentialAggregate> {
    const versions = (
      await this.client.list<CredentialVersionFields>("CredentialVersions")
    )
      .map(mapVersion)
      .filter(
        ({ fields }) => fields.credentialId === credential.fields.credentialId,
      )
      .toSorted((left, right) => left.fields.sequence - right.fields.sequence);
    const versionIds = new Set(versions.map(({ fields }) => fields.versionId));
    if (!versionIds.has(credential.fields.currentVersionId)) {
      throw new ApiError(
        503,
        "invalid_persisted_data",
        "La credencial referencia una versión inexistente.",
      );
    }
    const currentStates = versions.filter(({ fields }) =>
      ["active", "suspended"].includes(fields.state),
    );
    if (
      enforceInvariant &&
      credential.fields.state !== "revoked" &&
      (currentStates.length !== 1 ||
        currentStates[0]?.fields.versionId !==
          credential.fields.currentVersionId)
    ) {
      throw new ApiError(
        409,
        "credential_invariant_violation",
        "La credencial no tiene una única versión vigente.",
      );
    }
    return { credential, versions };
  }
}
