# Data Model: Auditoría de cumplimiento y retención

## Source-of-truth matrix

| Entity | Authoritative source | Airtable role |
|---|---|---|
| Functional demo event | Airtable `AuditEvents` | Case-study only |
| Compliance event | Corporate WORM store | None; optional opaque correlation only |
| Retention policy/evidence | Corporate compliance service | None |
| Recovery evidence | Corporate backup/recovery process | None |

## ComplianceAuditEvent (external WORM)

| Field | Rules |
|---|---|
| `eventId` | Globally unique and idempotent |
| `schemaVersion` | Required integer/version identifier |
| `occurredAt` | UTC timestamp from trusted server context |
| `actor` | Stable minimized actor reference and safe display value |
| `operation` | Versioned allowlisted action |
| `resourceType` / `resourceId` | Safe reference; resource may later disappear |
| `environment` | `test` or `production` when applicable |
| `result` / `failureCode` | Safe outcome; no raw exception |
| `originIp` | Normalized trusted network metadata |
| `requestId` / `operationId` | Correlation and reconciliation |
| `integrityReference` | Provider proof/version/immutable object reference |
| `retentionUntil` | Exactly five years under locked provider policy |

## ComplianceReceipt (operational, no secret)

Event ID, provider record ID, accepted timestamp, retention-until timestamp, integrity status and request/operation correlation. May be held transiently or as a non-authoritative reference; it is not evidence without the WORM record.

## SchemaVersion

Version ID, valid-from date, canonical schema digest, compatible reader/upcaster version and fixture set. Historical records are never rewritten merely to match a newer view.

## RecoveryEvidence

Recovery run ID, authorized operator, scope/time range, source backup/version, counts, first/last event IDs, order/integrity verification result and completion timestamp. Stored in the compliance system or its governed evidence repository.

## Invariants

- Existing events cannot be updated or deleted by KeyOps or operational administrators.
- Repeating append with the same event ID is one effect; different payload for that ID rejects.
- Retention is locked until `occurredAt + 5 years`.
- Query results sort deterministically by `(occurredAt, eventId)` and include integrity status.
- Secrets, tokens, OTP, passwords, delivery URLs, bodies and unnecessary PII are forbidden.
- Recovery preserves event count, ordering, IDs, relationships and integrity proofs.

