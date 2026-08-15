# Data Model: Integración con catálogo corporativo

## Source-of-truth matrix

| Entity | Authoritative source | Airtable role |
|---|---|---|
| Corporate institution | Corporate catalog | None; optional external ID reference only |
| Corporate API role | Corporate catalog | None; optional external ID reference only |
| Corporate application | Corporate catalog | None for identity/classification |
| Application operational context | Airtable | Authoritative for KeyOps management metadata |

## CorporateCatalogApplication (external, not stored in Airtable)

| Field | Rules |
|---|---|
| `externalApplicationId` | Required stable unique ID |
| `name` | Required current display name |
| `externalInstitutionId` / `institutionName` | Required current relationship |
| `externalRoleId` / `roleName` | Required current API role |
| `environment` | `test` or `production` |
| `active` | Inactive records cannot receive operations |
| `recordVersion` / `updatedAt` | Used for change detection and diagnostics |

## Airtable: ApplicationOperationalContexts

| Field | Airtable type | Rules |
|---|---|---|
| `contextId` | single line text | Stable unique KeyOps ID |
| `catalogApplicationId` | single line text | Required external ID |
| `environment` | single select | `test` or `production`; part of logical key |
| `technicalContact` | long text | JSON allowlist; no directory authority |
| `managementReason` | long text | Optional, maximum 500 characters |
| `requestOrTicketId` | single line text | Optional, maximum 100 characters |
| `credentialReferenceId` | single line text | Optional non-secret external reference |
| `updatedAt` | date/time | Worker-generated concurrency token |

## Invariants

- `(catalogApplicationId, environment)` is unique in operational contexts.
- Catalog fields are never changed through KeyOps or Airtable management routes.
- Context without a current catalog record is marked orphaned and excluded from operations.
- Duplicate/incomplete external records fail the request; they are not merged heuristically.
- No expired cache or representative record substitutes an unavailable catalog response.

