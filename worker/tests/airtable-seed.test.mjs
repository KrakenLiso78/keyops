import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  airtableSeed,
  buildAirtableSeed,
  normalizeSearchValue,
  TABLE_NAMES,
} from "../scripts/airtable/seed-data.mjs";

test("extrae el inventario inicial del seed móvil", () => {
  assert.deepEqual(
    Object.fromEntries(
      TABLE_NAMES.map((tableName) => [
        tableName,
        airtableSeed[tableName].length,
      ]),
    ),
    {
      Users: 4,
      Institutions: 24,
      ApiRoles: 4,
      Applications: 24,
      Credentials: 0,
      CredentialVersions: 0,
      DeliveryGrants: 0,
      IdempotencyRecords: 0,
      AuditEvents: 0,
    },
  );
});

test("mantiene los dos entornos y los cinco estados representativos", () => {
  const applications = airtableSeed.Applications;
  assert.equal(
    applications.filter(({ environment }) => environment === "test").length,
    12,
  );
  assert.equal(
    applications.filter(({ environment }) => environment === "production")
      .length,
    12,
  );
  assert.deepEqual(
    new Set(applications.map(({ credentialState }) => credentialState)),
    new Set([
      "no_credentials",
      "active",
      "suspended",
      "rotated_inactive",
      "revoked",
    ]),
  );
});

test("mantiene el fixture declarativo alineado con el seed", async () => {
  const fixture = JSON.parse(
    await readFile(
      new URL(
        "../scripts/airtable/fixtures/applications.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const expected = airtableSeed.Applications.map(
    ({ applicationId, environment }) => ({ applicationId, environment }),
  );

  assert.deepEqual(fixture, expected);
});

test("genera referencias deterministas y formatos Airtable válidos", () => {
  const first = buildAirtableSeed();
  const second = buildAirtableSeed();
  assert.deepEqual(first, second);
  assert.equal(
    normalizeSearchValue("Notificación electrónica"),
    "notificacion electronica",
  );

  const application = first.Applications.find(
    ({ applicationId }) => applicationId === "app-001",
  );
  assert.equal(application.institutionId, "inst-ayuntamiento-de-sevilla");
  assert.equal(application.roleId, "role-notificaciones");
  assert.deepEqual(JSON.parse(application.declaredIps), ["10.20.1.12"]);
  assert.deepEqual(JSON.parse(application.technicalContact), {
    displayName: "María López",
  });
});

test("no incluye secretos ni materiales de entrega", () => {
  assert.doesNotMatch(
    JSON.stringify(airtableSeed),
    /clientSecret|password|\botp\b|deliveryUrl|AIRTABLE_TOKEN/i,
  );
});

test("usa exclusivamente la matriz canónica de permisos granulares", () => {
  const permissionsByProfile = Object.fromEntries(
    airtableSeed.Users.map(({ profile, permissions }) => [
      profile,
      permissions,
    ]),
  );

  assert.deepEqual(permissionsByProfile.analyst, [
    "applications:read",
    "credentials:issue",
    "credentials:regenerate",
    "credentials:deliver",
    "credentials:suspend",
    "credentials:reactivate",
    "management:write",
    "usage:read",
  ]);
  assert.deepEqual(permissionsByProfile.senior_analyst, [
    ...permissionsByProfile.analyst,
    "credentials:revoke",
    "audit:read",
  ]);
  assert.deepEqual(permissionsByProfile.administrator, [
    ...permissionsByProfile.analyst,
    "credentials:revoke",
    "audit:read",
    "users:write",
  ]);
  assert.deepEqual(permissionsByProfile.auditor, ["audit:read"]);
  assert.doesNotMatch(
    JSON.stringify(permissionsByProfile),
    /credentials:transition|users:manage/,
  );
});

test("mantiene fixtures sintéticos por estado y ambiente sin secretos", async () => {
  const fixture = JSON.parse(
    await readFile(
      new URL("../scripts/airtable/fixtures/credentials.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(fixture.credentials.length, 6);
  assert.equal(fixture.versions.length, 7);
  assert.deepEqual(
    new Set(
      fixture.credentials.map(({ environment, state }) =>
        JSON.stringify([environment, state]),
      ),
    ),
    new Set(
      ["test", "production"].flatMap((environment) =>
        ["active", "suspended", "revoked"].map((state) =>
          JSON.stringify([environment, state]),
        ),
      ),
    ),
  );
  assert.ok(
    fixture.credentials.every(({ syntheticClientId }) =>
      syntheticClientId.startsWith("synthetic_"),
    ),
  );
  assert.doesNotMatch(
    JSON.stringify(fixture),
    /clientSecret|password|\botp\b|deliveryUrl/i,
  );
});
