import {
  fakeApplications,
  fakeUsers,
} from "../../../mobile/src/data/fake/seed.ts";
import { permissionsForProfile } from "../../../mobile/src/domain/policies/profilePermissions.ts";

export const TABLE_NAMES = [
  "Users",
  "Institutions",
  "ApiRoles",
  "Applications",
  "Credentials",
  "CredentialVersions",
  "DeliveryGrants",
  "IdempotencyRecords",
  "AuditEvents",
];

export const DELETE_ORDER = [
  "AuditEvents",
  "DeliveryGrants",
  "IdempotencyRecords",
  "CredentialVersions",
  "Credentials",
  "Applications",
  "ApiRoles",
  "Institutions",
  "Users",
];

export function normalizeSearchValue(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function stableId(prefix, value) {
  return `${prefix}-${normalizeSearchValue(value)}`
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function withoutUndefined(fields) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );
}

export function buildAirtableSeed() {
  const institutionIds = new Map();
  const roleIds = new Map();

  for (const application of fakeApplications) {
    institutionIds.set(
      application.institution,
      stableId("inst", application.institution),
    );
    roleIds.set(application.apiRole, stableId("role", application.apiRole));
  }

  const seed = {
    Users: fakeUsers.map((user) => ({
      userId: user.id,
      loginIdentifier: user.loginIdentifier,
      displayName: user.displayName,
      profile: user.profile,
      enabled: user.enabled,
      permissions: permissionsForProfile(user.profile),
      updatedAt: "2026-08-11T09:15:00.000Z",
    })),
    Institutions: [...institutionIds].map(([name, institutionId]) => ({
      institutionId,
      name,
      searchName: normalizeSearchValue(name),
    })),
    ApiRoles: [...roleIds].map(([name, roleId]) => ({
      roleId,
      name,
      serviceIdentifiers: [name],
    })),
    Applications: fakeApplications.map((application) =>
      withoutUndefined({
        applicationId: application.id,
        name: application.name,
        searchName: normalizeSearchValue(application.name),
        institutionId: institutionIds.get(application.institution),
        environment: application.environment,
        roleId: roleIds.get(application.apiRole),
        declaredIps: JSON.stringify(application.declaredIps),
        technicalContact: application.technicalContact
          ? JSON.stringify({ displayName: application.technicalContact })
          : undefined,
        requestOrTicketId: application.requestOrTicketId,
        credentialState: application.credentialState,
        lastChangedAt: application.lastChangedAt,
        updatedAt: application.lastChangedAt,
      }),
    ),
    Credentials: [],
    CredentialVersions: [],
    DeliveryGrants: [],
    IdempotencyRecords: [],
    AuditEvents: [],
  };

  validateSeed(seed);
  return seed;
}

export function validateSeed(seed) {
  const names = Object.keys(seed);
  if (
    names.length !== TABLE_NAMES.length ||
    TABLE_NAMES.some((name) => !(name in seed))
  ) {
    throw new Error(
      "El seed no contiene exactamente las nueve tablas de KeyOps.",
    );
  }

  for (const [tableName, records] of Object.entries(seed)) {
    if (!Array.isArray(records))
      throw new Error(`${tableName} no contiene una lista de registros.`);
  }

  const unique = (records, key) =>
    new Set(records.map((record) => record[key])).size;
  if (unique(seed.Users, "userId") !== seed.Users.length) {
    throw new Error("Hay userId duplicados en el seed.");
  }
  if (unique(seed.Institutions, "institutionId") !== seed.Institutions.length) {
    throw new Error("Hay institutionId duplicados en el seed.");
  }
  if (unique(seed.ApiRoles, "roleId") !== seed.ApiRoles.length) {
    throw new Error("Hay roleId duplicados en el seed.");
  }
  if (unique(seed.Applications, "applicationId") !== seed.Applications.length) {
    throw new Error("Hay applicationId duplicados en el seed.");
  }

  const institutionIds = new Set(
    seed.Institutions.map((record) => record.institutionId),
  );
  const roleIds = new Set(seed.ApiRoles.map((record) => record.roleId));
  for (const application of seed.Applications) {
    if (!institutionIds.has(application.institutionId)) {
      throw new Error(
        `${application.applicationId} referencia una institución inexistente.`,
      );
    }
    if (!roleIds.has(application.roleId)) {
      throw new Error(
        `${application.applicationId} referencia un rol inexistente.`,
      );
    }
  }

  const serialized = JSON.stringify(seed);
  if (
    /clientSecret|password|\botp\b|deliveryUrl|AIRTABLE_TOKEN/i.test(serialized)
  ) {
    throw new Error("El seed contiene un campo o valor prohibido.");
  }
}

export const airtableSeed = buildAirtableSeed();
