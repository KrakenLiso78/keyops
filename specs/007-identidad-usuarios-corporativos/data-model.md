# Data Model: Identidad y usuarios corporativos

## Source-of-truth matrix

| Entity | Authoritative source | Airtable role |
|---|---|---|
| Corporate identity | OIDC provider | Stable issuer/subject reference only |
| Corporate active state | OIDC provider | Last confirmed validation timestamp |
| KeyOps authorization/profile | Airtable | Authoritative |
| KeyOps web session | Worker signed/encrypted cookie | Not persisted in Airtable |

## External CorporateIdentity (not stored as claims document)

| Field | Rules |
|---|---|
| `issuer` | Exact configured HTTPS issuer |
| `subject` | Stable non-reassigned identifier |
| `displayName` | Optional display claim, minimized |
| `active` | Confirmed by provider mechanism |
| `validatedAt` | Maximum age five minutes for active sessions |

## Airtable: Users evolution

| Field | Airtable type | Rules |
|---|---|---|
| `userId` | single line text | Stable KeyOps ID |
| `corporateIssuer` | URL/single line text | Required for corporate users |
| `corporateSubject` | single line text | Required; unique with issuer |
| `displayName` | single line text | Minimized display value |
| `profile` | single select | Existing four profiles |
| `enabled` | checkbox | KeyOps authorization switch |
| `permissions` | multiple select | Canonical granular permission vocabulary |
| `identityValidatedAt` | date/time | Last corporate active-state confirmation |
| `updatedAt` | date/time | Optimistic concurrency token |

## OidcTransaction (encrypted cookie, short lived)

`state`, `nonce`, PKCE verifier, return path allowlist and expiry. Single use, maximum ten minutes, never stored in Airtable or logs.

## KeyOpsSession (encrypted/signed cookie)

Session ID, KeyOps user ID, issuer/subject hash, issued/expiry timestamps and authorization version. No OIDC access/refresh token or permissions are treated as authoritative claims.

## Invariants

- `(corporateIssuer, corporateSubject)` is unique; repeated registration updates no duplicate.
- Unknown/disabled identities are denied by default.
- Users cannot edit their own profile or permissions.
- The last effective administrator cannot remove their own final administrative permission.
- Permission/profile changes invalidate authorization immediately; external disable takes effect in at most five minutes.

