# Data Model: Datos representativos persistentes

## Institutions

| Field | Type | Rules |
|---|---|---|
| `institutionId` | text | Unique stable ID |
| `name` | text | Required; synthetic/anonymous |
| `searchName` | text | Pre-normalized lowercase text |

## ApiRoles

| Field | Type | Rules |
|---|---|---|
| `roleId` | text | Unique stable ID |
| `name` | text | Required |
| `serviceIdentifiers` | multiple select | Synthetic service names only |

## Applications

| Field | Type | Rules |
|---|---|---|
| `applicationId` | text | Unique stable ID |
| `name` / `searchName` | text | Display and normalized search values |
| `institutionId` | text | References `Institutions.institutionId` |
| `environment` | select | `test` or `production` |
| `roleId` | text | References `ApiRoles.roleId` |
| `declaredIps` | long text | JSON array validated by Worker |
| `technicalContact` | long text | JSON object with allowed contact fields |
| `managementReason` | long text | Optional, size-limited |
| `requestOrTicketId` | text | Optional, size-limited |
| `credentialState` | select | Denormalized display state maintained by feature 004 |
| `currentCredentialId` | text | Optional, maintained by feature 004 |
| `lastChangedAt` / `updatedAt` | date/time | Server-generated ISO instants |

## Derived API view

The Worker joins institution and role records into `IntegratedApplication`. Airtable record IDs, search helper fields and unrelated columns are never returned.

## Invariants

- `applicationId` is unique across both environments.
- Every application references an existing institution and role.
- Queries and writes include the active environment.
- Management updates reject stale `updatedAt` values.
- No field can contain Client Secret, OTP, password or delivery URL.
