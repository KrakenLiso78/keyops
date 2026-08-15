import assert from "node:assert/strict";
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
