# Data Model: Ciclo de vida de credenciales sintéticas

## Credentials

| Field | Type | Rules |
|---|---|---|
| `credentialId` | text | Stable unique ID |
| `applicationId` / `environment` | text/select | Immutable scope |
| `syntheticClientId` | text | Clearly synthetic, never a real client identifier |
| `currentVersionId` | text | Points to the only active/suspended version |
| `state` | select | `active`, `suspended`, `revoked` |
| `lastChangedAt` | date/time | Server generated |

## CredentialVersions

| Field | Type | Rules |
|---|---|---|
| `versionId` / `credentialId` | text | Unique and parent ID |
| `sequence` | integer | Monotonic per credential |
| `previousVersionId` | text | Empty for first issue |
| `state` | select | `pending`, `active`, `suspended`, `rotated_inactive`, `revoked` |
| `operationId` | text | Correlates recovery/idempotency |
| `reason` | long text | Required for transitions |
| `createdAt` / `stateChangedAt` | date/time | Server generated |

## DeliveryGrants

| Field | Type | Rules |
|---|---|---|
| `deliveryId` / `credentialVersionId` | text | Unique and parent ID |
| `codeDigest` | text | HMAC digest only; never plaintext code |
| `expiresAt` | date/time | Exactly two minutes after creation |
| `consumedAt` / `invalidatedAt` | date/time | Optional, mutually meaningful |
| `operationId` | text | Correlation |

## IdempotencyRecords

| Field | Type | Rules |
|---|---|---|
| `scopeKey` | text | Hash of user + environment + idempotency key; unique |
| `requestFingerprint` | text | Hash of operation, resource and normalized body |
| `operationId` | text | Stable operation ID |
| `status` | select | `processing`, `committed`, `failed` |
| `receiptJson` | long text | Safe receipt; no code after initial response |
| `expiresAt` | date/time | Cleanup boundary for case-study records |

## Invariants and transitions

- At most one version is `active` or `suspended` for a credential.
- `none → active` (issue); `active → rotated_inactive + new active` (regenerate).
- `active ↔ suspended`; `active|suspended → revoked`; revoked is terminal.
- New delivery invalidates earlier unused grants for that version.
- Code validation changes exactly one grant from available to consumed.
- Same scope key + same fingerprint returns the original effect; different fingerprint rejects.
