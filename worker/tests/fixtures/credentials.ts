import type {
  CredentialFields,
  CredentialVersionFields,
} from "../../src/airtable/credentialSchema";
import type {
  DeliveryGrantFields,
  IdempotencyFields,
} from "../../src/airtable/operationSchema";

export const credentialFixtureNow = "2026-08-15T10:00:00.000Z";

export const activeCredential: CredentialFields = {
  credentialId: "cred-app-test",
  applicationId: "app-test",
  environment: "test",
  syntheticClientId: "synthetic_test_app_test",
  currentVersionId: "ver-app-test-1",
  state: "active",
  operationId: "operation-initial",
  lastChangedAt: credentialFixtureNow,
  schemaVersion: "1",
};

export const activeVersion: CredentialVersionFields = {
  versionId: "ver-app-test-1",
  credentialId: activeCredential.credentialId,
  sequence: 1,
  state: "active",
  operationId: activeCredential.operationId,
  createdAt: credentialFixtureNow,
  stateChangedAt: credentialFixtureNow,
  schemaVersion: "1",
};

export const emptyCredentialTables = {
  Credentials: [] as CredentialFields[],
  CredentialVersions: [] as CredentialVersionFields[],
  DeliveryGrants: [] as DeliveryGrantFields[],
  IdempotencyRecords: [] as IdempotencyFields[],
};
