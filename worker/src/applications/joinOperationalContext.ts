import type {
  CredentialFields,
  CredentialVersionFields,
} from "../airtable/credentialSchema";
import type { PersistedOperationalContext } from "../airtable/ApplicationOperationalContextRepository";
import type { IntegratedApplication } from "../airtable/applicationSchema";
import {
  integratedApplicationSchema,
  technicalContactSchema,
} from "../airtable/applicationSchema";
import type { CorporateCatalogApplication } from "../catalog/CorporateCatalogPort";
import type { RealCredentialReferenceFields } from "../credentials/real/realCredentialSchemas";
import { ApiError } from "../http/ApiError";

function parseJson(value: string, label: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new ApiError(
      503,
      "invalid_operational_context",
      `${label} contiene datos inválidos.`,
    );
  }
}

export function joinOperationalContext(input: {
  catalog: CorporateCatalogApplication[];
  contexts: PersistedOperationalContext[];
  credentials?: CredentialFields[];
  versions?: CredentialVersionFields[];
  realReferences?: RealCredentialReferenceFields[];
}): IntegratedApplication[] {
  const catalogKeys = new Set(
    input.catalog.map(
      (item) => `${item.environment}:${item.externalApplicationId}`,
    ),
  );
  const contextMap = new Map<string, PersistedOperationalContext>();
  for (const context of input.contexts) {
    const key = `${context.fields.environment}:${context.fields.catalogApplicationId}`;
    if (!catalogKeys.has(key)) {
      throw new ApiError(
        503,
        "orphaned_operational_context",
        "Existe un contexto operativo sin aplicación corporativa vigente.",
      );
    }
    if (contextMap.has(key)) {
      throw new ApiError(
        409,
        "duplicate_operational_context",
        "El contexto operativo está duplicado.",
      );
    }
    contextMap.set(key, context);
  }

  return input.catalog.map((catalog) => {
    const key = `${catalog.environment}:${catalog.externalApplicationId}`;
    const context = contextMap.get(key)?.fields;
    const credentials = (input.credentials ?? []).filter(
      (credential) =>
        credential.applicationId === catalog.externalApplicationId &&
        credential.environment === catalog.environment,
    );
    if (credentials.length > 1) {
      throw new ApiError(
        409,
        "duplicate_credential",
        "La aplicación tiene más de una credencial.",
      );
    }
    const credential = credentials[0];
    const realReferences = (input.realReferences ?? []).filter(
      (reference) =>
        reference.catalogApplicationId === catalog.externalApplicationId &&
        reference.environment === catalog.environment,
    );
    if (realReferences.length > 1) {
      throw new ApiError(
        409,
        "duplicate_real_credential_reference",
        "La aplicación tiene más de una referencia de credencial real.",
      );
    }
    const realReference = realReferences[0];
    const history = credential
      ? (input.versions ?? [])
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
    const technicalContact = context?.technicalContact
      ? technicalContactSchema.parse(
          parseJson(context.technicalContact, "technicalContact"),
        )
      : undefined;
    const declaredIps = context?.declaredIps
      ? parseJson(context.declaredIps, "declaredIps")
      : [];
    if (
      !Array.isArray(declaredIps) ||
      declaredIps.some((value) => typeof value !== "string")
    ) {
      throw new ApiError(
        503,
        "invalid_operational_context",
        "declaredIps contiene datos inválidos.",
      );
    }
    return integratedApplicationSchema.parse({
      id: catalog.externalApplicationId,
      name: catalog.name,
      institution: {
        id: catalog.externalInstitutionId,
        name: catalog.institutionName,
      },
      environment: catalog.environment,
      apiRole: {
        id: catalog.externalRoleId,
        name: catalog.roleName,
        serviceIdentifiers: [],
      },
      declaredIps,
      management: {
        technicalContact,
        reason: context?.managementReason,
        requestOrTicketId: context?.requestOrTicketId,
        updatedAt: context?.updatedAt,
      },
      credentialState:
        realReference?.effectiveState === "reconciliation_required"
          ? (credential?.state ?? "no_credentials")
          : (realReference?.effectiveState ??
            credential?.state ??
            "no_credentials"),
      credentialId:
        realReference?.referenceId ??
        credential?.credentialId ??
        context?.credentialReferenceId,
      clientId: realReference ? undefined : credential?.syntheticClientId,
      stateHistory: history,
      lastChangedAt:
        realReference?.updatedAt ??
        credential?.lastChangedAt ??
        context?.updatedAt ??
        catalog.updatedAt,
      updatedAt:
        realReference?.updatedAt ?? context?.updatedAt ?? catalog.updatedAt,
    });
  });
}
