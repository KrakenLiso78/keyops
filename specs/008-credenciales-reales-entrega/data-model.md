# Data Model: Credenciales reales y entrega segura

## Source-of-truth matrix

| Entity | Authoritative source | Airtable role |
|---|---|---|
| Real credential/secret | Corporate credential service | Opaque reference only |
| Real version and effective state | Corporate credential service | Last confirmed projection |
| ZIP/password/OTP | Secure delivery service | No storage |
| Operation/idempotency metadata | Worker + Airtable | Recovery and correlation without secrets |

## ExternalCredential (external, never stored with secret)

`externalCredentialId`, external application ID, environment, current external version ID, effective state and provider timestamps. Client Secret is explicitly absent.

## Airtable: RealCredentialReferences

| Field | Airtable type | Rules |
|---|---|---|
| `referenceId` | single line text | Stable KeyOps ID |
| `externalCredentialId` | single line text | Opaque provider ID, unique by environment |
| `catalogApplicationId` | single line text | Links feature 006 |
| `environment` | single select | `test` or `production` |
| `externalVersionId` | single line text | Last confirmed provider version |
| `effectiveState` | single select | `active`, `suspended`, `revoked`, `reconciliation_required` |
| `lastOperationId` | single line text | Provider correlation |
| `lastConfirmedAt` | date/time | Successful status probe timestamp |
| `updatedAt` | date/time | Worker concurrency token |

## Airtable: RealOperationReceipts

| Field | Airtable type | Rules |
|---|---|---|
| `operationId` | single line text | Unique KeyOps operation |
| `providerOperationId` | single line text | Opaque external correlation |
| `idempotencyScopeHash` | single line text | Hash; no raw credentials/body |
| `action` / `result` | single select | Versioned operation and safe outcome |
| `deliveryReferenceId` | single line text | Optional opaque reference, never URL/password/OTP |
| `auditEventId` | single line text | Compliance correlation when available |
| `createdAt` / `confirmedAt` | date/time | Lifecycle timestamps |

## SecureDelivery (external, not stored in Airtable)

Opaque delivery ID, one-time access URL, OTP expiry, channel identifiers and consumed status. ZIP bytes, password, OTP and Client Secret are forbidden in all Airtable fields.

## State and invariants

- Exactly one provider version is effectively active after issue/rotation.
- `active ↔ suspended`; `active|suspended → revoked`; revoked is terminal.
- `pending → confirmed|reconciliation_required`; no UI success before confirmed.
- Same idempotency scope/body produces one provider effect; different body rejects.
- OTP is one use/two minutes and distinct from ZIP password; neither is persisted by KeyOps.

