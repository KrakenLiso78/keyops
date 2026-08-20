const BASE_ID_PATTERN = /^app[a-zA-Z0-9]{14}$/;

const EXPECTED_TABLES = {
  Users: {
    owner: "002/007",
    fields: {
      userId: "singleLineText",
      loginIdentifier: "singleLineText",
      displayName: "singleLineText",
      profile: "singleSelect",
      enabled: "checkbox",
      permissions: "multipleSelects",
      updatedAt: "dateTime",
      corporateIssuer: ["url", "singleLineText"],
      corporateSubject: "singleLineText",
      identityValidatedAt: "dateTime",
    },
  },
  Institutions: {
    owner: "003",
    fields: {
      institutionId: "singleLineText",
      name: "singleLineText",
      searchName: "singleLineText",
    },
  },
  ApiRoles: {
    owner: "003",
    fields: {
      roleId: "singleLineText",
      name: "singleLineText",
      serviceIdentifiers: "multipleSelects",
    },
  },
  Applications: {
    owner: "003/004",
    fields: {
      applicationId: "singleLineText",
      name: "singleLineText",
      searchName: "singleLineText",
      institutionId: "singleLineText",
      environment: "singleSelect",
      roleId: "singleLineText",
      declaredIps: "multilineText",
      technicalContact: "multilineText",
      managementReason: "multilineText",
      requestOrTicketId: "singleLineText",
      credentialState: "singleSelect",
      currentCredentialId: "singleLineText",
      lastChangedAt: "dateTime",
      updatedAt: "dateTime",
    },
  },
  Credentials: {
    owner: "004",
    fields: {
      credentialId: "singleLineText",
      applicationId: "singleLineText",
      environment: "singleSelect",
      syntheticClientId: "singleLineText",
      currentVersionId: "singleLineText",
      state: "singleSelect",
      operationId: "singleLineText",
      lastChangedAt: "dateTime",
      schemaVersion: "singleLineText",
    },
  },
  CredentialVersions: {
    owner: "004",
    fields: {
      versionId: "singleLineText",
      credentialId: "singleLineText",
      sequence: "number",
      previousVersionId: "singleLineText",
      state: "singleSelect",
      operationId: "singleLineText",
      reason: "multilineText",
      createdAt: "dateTime",
      stateChangedAt: "dateTime",
      schemaVersion: "singleLineText",
    },
  },
  DeliveryGrants: {
    owner: "004",
    fields: {
      deliveryId: "singleLineText",
      credentialVersionId: "singleLineText",
      applicationId: "singleLineText",
      environment: "singleSelect",
      codeDigest: "singleLineText",
      expiresAt: "dateTime",
      consumedAt: "dateTime",
      invalidatedAt: "dateTime",
      operationId: "singleLineText",
      createdAt: "dateTime",
      schemaVersion: "singleLineText",
    },
  },
  IdempotencyRecords: {
    owner: "004",
    fields: {
      scopeKey: "singleLineText",
      requestFingerprint: "singleLineText",
      operationId: "singleLineText",
      status: "singleSelect",
      receiptJson: "multilineText",
      failureCode: "singleLineText",
      expiresAt: "dateTime",
      createdAt: "dateTime",
      updatedAt: "dateTime",
      schemaVersion: "singleLineText",
    },
  },
  AuditEvents: {
    owner: "005",
    fields: {
      eventId: "singleLineText",
      schemaVersion: "number",
      occurredAt: "dateTime",
      actorUserId: "singleLineText",
      actorDisplayName: "singleLineText",
      operation: ["singleLineText", "singleSelect"],
      resourceType: "singleLineText",
      resourceId: "singleLineText",
      environment: "singleSelect",
      institutionId: "singleLineText",
      applicationId: "singleLineText",
      credentialId: "singleLineText",
      result: "singleSelect",
      originIp: "singleLineText",
      failureCode: "singleLineText",
      requestId: "singleLineText",
      operationId: "singleLineText",
      testRunId: "singleLineText",
    },
  },
  ApplicationOperationalContexts: {
    owner: "006",
    fields: {
      contextId: "singleLineText",
      catalogApplicationId: "singleLineText",
      environment: "singleSelect",
      technicalContact: "multilineText",
      managementReason: "multilineText",
      requestOrTicketId: "singleLineText",
      credentialReferenceId: "singleLineText",
      declaredIps: "multilineText",
      updatedAt: "dateTime",
    },
  },
  RealCredentialReferences: {
    owner: "008",
    fields: {
      referenceId: "singleLineText",
      externalCredentialId: "singleLineText",
      catalogApplicationId: "singleLineText",
      environment: "singleSelect",
      externalVersionId: "singleLineText",
      effectiveState: "singleSelect",
      lastOperationId: "singleLineText",
      lastConfirmedAt: "dateTime",
      updatedAt: "dateTime",
      sealedDeliveryHandle: "singleLineText",
      schemaVersion: "singleLineText",
    },
  },
  RealOperationReceipts: {
    owner: "008",
    fields: {
      operationId: "singleLineText",
      providerOperationId: "singleLineText",
      idempotencyScopeHash: "singleLineText",
      requestFingerprint: "singleLineText",
      requestId: "singleLineText",
      actorUserId: "singleLineText",
      catalogApplicationId: "singleLineText",
      environment: "singleSelect",
      referenceId: "singleLineText",
      action: "singleSelect",
      status: "singleSelect",
      result: "singleSelect",
      deliveryReferenceId: "singleLineText",
      deliveryExpiresAt: "dateTime",
      auditEventId: "singleLineText",
      failureCode: "singleLineText",
      createdAt: "dateTime",
      confirmedAt: "dateTime",
      updatedAt: "dateTime",
      schemaVersion: "singleLineText",
    },
  },
};

const baseId = process.env.AIRTABLE_BASE_ID;
const token = process.env.AIRTABLE_TOKEN;

if (!BASE_ID_PATTERN.test(baseId ?? "")) {
  throw new Error("AIRTABLE_BASE_ID no tiene el formato esperado.");
}
if (!token) {
  throw new Error("Falta AIRTABLE_TOKEN en worker/.env.");
}

async function getJson(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.text();
    const safeDetail = body.slice(0, 300).replaceAll(token, "[REDACTED]");
    const error = new Error(`Airtable GET ${response.status}: ${safeDetail}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function acceptsType(expected, actual) {
  return Array.isArray(expected)
    ? expected.includes(actual)
    : expected === actual;
}

let metadata;
let schemaError;
try {
  metadata = await getJson(
    `https://api.airtable.com/v0/meta/bases/${baseId}/tables`,
  );
} catch (error) {
  schemaError = {
    status: error.status ?? "unknown",
    message: error.message,
    requiredScope: "schema.bases:read",
  };
}

const actualTables = new Map(
  (metadata?.tables ?? []).map((table) => [table.name, table]),
);
const tables = [];
const differences = [];

for (const [tableName, expected] of Object.entries(EXPECTED_TABLES)) {
  if (!metadata) {
    try {
      const sample = await getJson(
        `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?pageSize=3`,
      );
      const observedFields = [
        ...new Set(
          sample.records.flatMap((record) => Object.keys(record.fields)),
        ),
      ].sort();
      tables.push({
        table: tableName,
        owner: expected.owner,
        status: "table_readable_schema_unverified",
        sampleRecordCount: sample.records.length,
        observedPopulatedFields: observedFields,
      });
    } catch (error) {
      tables.push({
        table: tableName,
        owner: expected.owner,
        status: "table_unreadable",
        readError: {
          status: error.status ?? "unknown",
          message: error.message,
        },
      });
    }
    continue;
  }

  const actual = actualTables.get(tableName);
  if (!actual) {
    differences.push({
      feature: expected.owner,
      table: tableName,
      kind: "missing_table",
      detail: `Falta la tabla ${tableName}`,
    });
    tables.push({ table: tableName, owner: expected.owner, status: "missing" });
    continue;
  }

  const actualFields = new Map(
    actual.fields.map((field) => [field.name, field]),
  );
  const fieldChecks = [];
  for (const [fieldName, expectedType] of Object.entries(expected.fields)) {
    const actualField = actualFields.get(fieldName);
    if (!actualField) {
      differences.push({
        feature: expected.owner,
        table: tableName,
        field: fieldName,
        kind: "missing_field",
        detail: `Falta ${tableName}.${fieldName}`,
      });
      fieldChecks.push({ field: fieldName, expectedType, status: "missing" });
      continue;
    }

    const status = acceptsType(expectedType, actualField.type)
      ? "match"
      : "type_mismatch";
    if (status !== "match") {
      differences.push({
        feature: expected.owner,
        table: tableName,
        field: fieldName,
        kind: status,
        detail: `Esperado ${[].concat(expectedType).join("|")}; observado ${actualField.type}`,
      });
    }
    fieldChecks.push({
      field: fieldName,
      expectedType,
      actualType: actualField.type,
      status,
    });
  }

  const sample = await getJson(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}?pageSize=3`,
  );
  tables.push({
    table: tableName,
    owner: expected.owner,
    status: fieldChecks.every((field) => field.status === "match")
      ? "match"
      : "difference",
    sampleRecordCount: sample.records.length,
    fieldChecks,
  });
}

const unexpectedTables = (metadata?.tables ?? [])
  .map((table) => table.name)
  .filter((tableName) => !(tableName in EXPECTED_TABLES));

process.stdout.write(
  `${JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      baseId,
      mode: "read-only",
      requests: ["schema metadata", "up to 3 records per expected table"],
      schemaValidationStatus: metadata ? "complete" : "blocked",
      schemaError,
      expectedTableCount: Object.keys(EXPECTED_TABLES).length,
      observedTableCount: metadata?.tables.length ?? null,
      tables,
      unexpectedTables,
      differences,
    },
    null,
    2,
  )}\n`,
);

if (!metadata) process.exitCode = 3;
else if (differences.length > 0) process.exitCode = 2;
