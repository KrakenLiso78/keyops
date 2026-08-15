import { ApiError } from "../http/ApiError";
import type { AirtableRecord } from "./AirtableClient";
import {
  apiRoleFieldsSchema,
  applicationFieldsSchema,
  institutionFieldsSchema,
  integratedApplicationSchema,
  technicalContactSchema,
  type ApiRoleFields,
  type ApplicationFields,
  type InstitutionFields,
  type IntegratedApplication,
} from "./applicationSchema";
import {
  credentialFieldsSchema,
  credentialVersionFieldsSchema,
  type CredentialFields,
  type CredentialVersionFields,
} from "./credentialSchema";

function parseJson(value: string, label: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new ApiError(
      503,
      "invalid_persisted_data",
      `${label} contiene datos inválidos.`,
    );
  }
}

function duplicateSafeMap<T extends { id: string }>(
  items: T[],
  label: string,
): Map<string, T> {
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

export function mapApplications(
  applicationRecords: AirtableRecord<ApplicationFields>[],
  institutionRecords: AirtableRecord<InstitutionFields>[],
  roleRecords: AirtableRecord<ApiRoleFields>[],
  credentialRecords: AirtableRecord<CredentialFields>[] = [],
  versionRecords: AirtableRecord<CredentialVersionFields>[] = [],
): IntegratedApplication[] {
  const institutions = duplicateSafeMap(
    institutionRecords.map((record) => {
      const fields = institutionFieldsSchema.parse(record.fields);
      return { id: fields.institutionId, name: fields.name };
    }),
    "Institutions",
  );
  const roles = duplicateSafeMap(
    roleRecords.map((record) => {
      const fields = apiRoleFieldsSchema.parse(record.fields);
      return {
        id: fields.roleId,
        name: fields.name,
        serviceIdentifiers: fields.serviceIdentifiers,
      };
    }),
    "ApiRoles",
  );
  const seen = new Set<string>();
  const credentials = credentialRecords.map((record) =>
    credentialFieldsSchema.parse(record.fields),
  );
  const versions = versionRecords.map((record) =>
    credentialVersionFieldsSchema.parse(record.fields),
  );

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
    const apiRole = roles.get(fields.roleId);
    if (!institution || !apiRole) {
      throw new ApiError(
        503,
        "invalid_persisted_data",
        "La aplicación contiene una referencia inválida.",
      );
    }
    const declaredIps = parseStringArray(fields.declaredIps);
    const contactValue = fields.technicalContact
      ? parseJson(fields.technicalContact, "technicalContact")
      : undefined;
    const legacyContact = contactValue as
      | {
          displayName?: unknown;
          name?: unknown;
          email?: unknown;
          phone?: unknown;
        }
      | undefined;
    const technicalContact = legacyContact
      ? technicalContactSchema.parse({
          name: legacyContact.name ?? legacyContact.displayName,
          email: legacyContact.email,
          phone: legacyContact.phone,
        })
      : undefined;
    const matchingCredentials = credentials.filter(
      (credential) =>
        credential.applicationId === fields.applicationId &&
        credential.environment === fields.environment,
    );
    if (matchingCredentials.length > 1) {
      throw new ApiError(
        409,
        "duplicate_credential",
        "La aplicación tiene más de una credencial sintética.",
      );
    }
    const credential = matchingCredentials[0];
    const stateHistory = credential
      ? versions
          .filter((version) => version.credentialId === credential.credentialId)
          .filter((version) => version.state !== "pending")
          .toSorted((left, right) =>
            right.stateChangedAt.localeCompare(left.stateChangedAt),
          )
          .map((version) => ({
            state: version.state,
            changedAt: version.stateChangedAt,
          }))
      : [];
    return integratedApplicationSchema.parse({
      id: fields.applicationId,
      name: fields.name,
      institution,
      environment: fields.environment,
      apiRole,
      declaredIps,
      management: {
        technicalContact,
        reason: fields.managementReason,
        requestOrTicketId: fields.requestOrTicketId,
        updatedAt: fields.updatedAt,
      },
      credentialState: fields.credentialState,
      credentialId: credential?.credentialId ?? fields.currentCredentialId,
      clientId: credential?.syntheticClientId,
      stateHistory,
      lastChangedAt: fields.lastChangedAt,
      updatedAt: fields.updatedAt,
    });
  });
}

function parseStringArray(value: string): string[] {
  const parsed = parseJson(value, "declaredIps");
  if (
    !Array.isArray(parsed) ||
    parsed.some((item) => typeof item !== "string")
  ) {
    throw new ApiError(
      503,
      "invalid_persisted_data",
      "declaredIps contiene datos inválidos.",
    );
  }
  return parsed;
}
