# Data Model: Publicación web móvil y acceso por perfil

## Airtable table: Users

| Field | Type | Rules |
|---|---|---|
| `userId` | single line text | Stable unique business identifier |
| `loginIdentifier` | single line text | Unique, normalized lowercase; no password |
| `displayName` | single line text | Required, synthetic or internal demo label |
| `profile` | single select | `analyst`, `senior_analyst`, `administrator`, `auditor` |
| `enabled` | checkbox | Disabled users cannot create or restore a session |
| `permissions` | multiple select | Values from the domain `Permission` union |
| `updatedAt` | date/time | Server-generated ISO instant |

The PAT is scoped to this base. Passwords, session tokens and signing material never enter Airtable.

## Session token (not persisted)

| Claim | Purpose |
|---|---|
| `sub` | `userId` used to reload the user |
| `iat` / `exp` | Short validity window |
| `jti` | Request correlation, not authorization state |
| `v` | Token contract version |

The Worker verifies signature and expiry, then reloads/caches the enabled user. Profile and permissions in Airtable remain authoritative.

## Environment state (client memory)

`test | production`, initialized explicitly after sign-in. It is not a production system selector. Changing it invalidates screen state and request scopes from the previous environment.

## Validation and transitions

- Sign-in: unknown, disabled or invalid secret → generic rejection.
- Restore: invalid/expired token or disabled user → session cleared.
- Permission: absent permission → deny by default before route logic.
- Sign-out: local token removed and sensitive UI state reset.
