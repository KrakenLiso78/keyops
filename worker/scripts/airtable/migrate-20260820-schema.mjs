const CONFIRMATION = "--confirm-migrate=KeyOps";
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const confirmed = args.has(CONFIRMATION);
const allowedArgs = new Set(["--dry-run", CONFIRMATION]);

const select = (...names) => ({
  type: "singleSelect",
  options: { choices: names.map((name) => ({ name })) },
});

const existingTableAdditions = {
  Users: [
    { name: "corporateIssuer", type: "singleLineText" },
    { name: "corporateSubject", type: "singleLineText" },
    { name: "identityValidatedAt", type: "dateTime" },
  ],
  Credentials: [
    { name: "operationId", type: "singleLineText" },
    { name: "schemaVersion", type: "singleLineText" },
  ],
  CredentialVersions: [{ name: "schemaVersion", type: "singleLineText" }],
  DeliveryGrants: [
    { name: "applicationId", type: "singleLineText" },
    { name: "environment", ...select("test", "production") },
    { name: "createdAt", type: "dateTime" },
    { name: "schemaVersion", type: "singleLineText" },
  ],
  IdempotencyRecords: [
    { name: "failureCode", type: "singleLineText" },
    { name: "createdAt", type: "dateTime" },
    { name: "updatedAt", type: "dateTime" },
    { name: "schemaVersion", type: "singleLineText" },
  ],
  AuditEvents: [{ name: "testRunId", type: "singleLineText" }],
};

const newTables = {
  RuntimeConfiguration: [
    { name: "configurationId", type: "singleLineText" },
    { name: "documentJson", type: "multilineText" },
    { name: "updatedAt", type: "dateTime" },
  ],
  ApplicationOperationalContexts: [
    { name: "contextId", type: "singleLineText" },
    { name: "catalogApplicationId", type: "singleLineText" },
    { name: "environment", ...select("test", "production") },
    { name: "technicalContact", type: "multilineText" },
    { name: "managementReason", type: "multilineText" },
    { name: "requestOrTicketId", type: "singleLineText" },
    { name: "credentialReferenceId", type: "singleLineText" },
    { name: "declaredIps", type: "multilineText" },
    { name: "updatedAt", type: "dateTime" },
  ],
  RealCredentialReferences: [
    { name: "referenceId", type: "singleLineText" },
    { name: "externalCredentialId", type: "singleLineText" },
    { name: "catalogApplicationId", type: "singleLineText" },
    { name: "environment", ...select("test", "production") },
    { name: "externalVersionId", type: "singleLineText" },
    {
      name: "effectiveState",
      ...select("active", "suspended", "revoked", "reconciliation_required"),
    },
    { name: "lastOperationId", type: "singleLineText" },
    { name: "lastConfirmedAt", type: "dateTime" },
    { name: "updatedAt", type: "dateTime" },
    { name: "sealedDeliveryHandle", type: "singleLineText" },
    { name: "schemaVersion", type: "singleLineText" },
  ],
  RealOperationReceipts: [
    { name: "operationId", type: "singleLineText" },
    { name: "providerOperationId", type: "singleLineText" },
    { name: "idempotencyScopeHash", type: "singleLineText" },
    { name: "requestFingerprint", type: "singleLineText" },
    { name: "requestId", type: "singleLineText" },
    { name: "actorUserId", type: "singleLineText" },
    { name: "catalogApplicationId", type: "singleLineText" },
    { name: "environment", ...select("test", "production") },
    { name: "referenceId", type: "singleLineText" },
    {
      name: "action",
      ...select("issue", "rotate", "suspend", "reactivate", "revoke"),
    },
    {
      name: "status",
      ...select("pending", "confirmed", "reconciliation_required"),
    },
    {
      name: "result",
      ...select("pending", "succeeded", "failed", "rejected"),
    },
    { name: "deliveryReferenceId", type: "singleLineText" },
    { name: "deliveryExpiresAt", type: "dateTime" },
    { name: "auditEventId", type: "singleLineText" },
    { name: "failureCode", type: "singleLineText" },
    { name: "createdAt", type: "dateTime" },
    { name: "confirmedAt", type: "dateTime" },
    { name: "updatedAt", type: "dateTime" },
    { name: "schemaVersion", type: "singleLineText" },
  ],
};

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (
  [...args].some((argument) => !allowedArgs.has(argument)) ||
  dryRun === confirmed
) {
  fail(`Uso: migrate-20260820-schema.mjs --dry-run | ${CONFIRMATION}`);
}

const token = process.env.AIRTABLE_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID;
if (!token) fail("Falta AIRTABLE_TOKEN en worker/.env o en el entorno.");
if (!/^app[A-Za-z0-9]{14}$/.test(baseId ?? "")) {
  fail("AIRTABLE_BASE_ID no tiene el formato esperado.");
}

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function request(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const providerCode = payload?.error?.type ?? "unknown_error";
    throw new Error(`Airtable ${response.status}: ${providerCode}`);
  }
  return payload;
}

function createPayload(field) {
  if (field.type === "dateTime") {
    return {
      ...field,
      options: {
        dateFormat: { name: "iso" },
        timeFormat: { name: "24hour" },
        timeZone: "utc",
      },
    };
  }
  return field;
}

const metadataUrl = `https://api.airtable.com/v0/meta/bases/${baseId}/tables`;
const metadata = await request(metadataUrl);
const tables = new Map(metadata.tables.map((table) => [table.name, table]));
const tablePlans = [];
const fieldPlans = [];

for (const [tableName, fields] of Object.entries(newTables)) {
  const table = tables.get(tableName);
  if (!table) {
    tablePlans.push({ tableName, fields });
    continue;
  }
  const existing = new Set(table.fields.map((field) => field.name));
  for (const field of fields) {
    if (!existing.has(field.name)) fieldPlans.push({ table, tableName, field });
  }
}

for (const [tableName, fields] of Object.entries(existingTableAdditions)) {
  const table = tables.get(tableName);
  if (!table) fail(`Falta la tabla base ${tableName}.`);
  const existing = new Set(table.fields.map((field) => field.name));
  for (const field of fields) {
    if (!existing.has(field.name)) fieldPlans.push({ table, tableName, field });
  }
}

if (tablePlans.length === 0 && fieldPlans.length === 0) {
  console.log("La migración ya está aplicada; no hay cambios pendientes.");
  process.exit(0);
}

console.table([
  ...tablePlans.map(({ tableName, fields }) => ({
    action: "create_table",
    table: tableName,
    detail: `${fields.length} fields`,
  })),
  ...fieldPlans.map(({ tableName, field }) => ({
    action: "create_field",
    table: tableName,
    detail: `${field.name}:${field.type}`,
  })),
]);

if (dryRun) {
  console.log("Comprobación de solo lectura; no se ha modificado Airtable.");
  process.exit(0);
}

for (const { tableName, fields } of tablePlans) {
  await request(metadataUrl, {
    method: "POST",
    body: JSON.stringify({
      name: tableName,
      fields: fields.map(createPayload),
    }),
  });
  console.log(`Creada ${tableName}.`);
  await delay(220);
}

for (const { table, tableName, field } of fieldPlans) {
  await request(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables/${table.id}/fields`,
    { method: "POST", body: JSON.stringify(createPayload(field)) },
  );
  console.log(`Añadido ${tableName}.${field.name}.`);
  await delay(220);
}

console.log(
  `Migración aditiva completada: ${tablePlans.length} tablas y ${fieldPlans.length} campos.`,
);
