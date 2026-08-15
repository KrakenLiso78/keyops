# Implementation Plan: Identidad y usuarios corporativos

**Branch**: `[007-identidad-usuarios-corporativos]` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-identidad-usuarios-corporativos/spec.md`

## Summary

Reemplazar las credenciales predefinidas por OpenID Connect Authorization Code con PKCE, gestionado por el Worker como backend de confianza. El proveedor corporativo autentica y mantiene la identidad; Airtable conserva únicamente la autorización KeyOps, perfil, estado y permisos. La sesión KeyOps se revalida como máximo cada cinco minutos y cada operación sigue autorizándose en el Worker.

## Technical Context

**Language/Version**: TypeScript 6.0.3 estricto; Node.js 25.9.0 y npm 11.12.1

**Primary Dependencies**: Stack 002–006; Web Crypto, `fetch`, Zod 4.4.3 y descubrimiento OIDC estándar; sin SDK del proveedor por defecto

**Storage**: Proveedor OIDC autoritativo para identidad; Airtable `Users` para autorización KeyOps; cookies HttpOnly/Secure/SameSite para sesión web

**Testing**: Vitest y contratos OIDC simulados, Jest/RNTL para UI/roles, pruebas de seguridad de redirect/token y validación en tenant corporativo de test

**Target Platform**: Expo Web móvil + Cloudflare Worker + proveedor OIDC corporativo

**Project Type**: Aplicación web móvil con BFF serverless e identidad federada

**Performance Goals**: Revalidación de autorización por operación; estado corporativo con antigüedad máxima de cinco minutos; sin llamadas OIDC desde cada pantalla

**Constraints**: Authorization Code + PKCE S256; issuer/audience/nonce/redirect exactos; sin contraseñas ni tokens OIDC en Airtable/bundle/logs

**Scale/Scope**: Usuarios internos del piloto, cuatro perfiles KeyOps y administración de autorización, no del directorio

## Constitution Check

*GATE: Passed with the explicit time-bounded deviation below; re-checked after Phase 1.*

| Gate | Design evidence | Result |
|---|---|---|
| Seguridad | OIDC code flow, PKCE S256, state/nonce, cookies seguras y secretos solo en Worker | PASS |
| Mínimo privilegio | IdP autentica; Airtable concede permisos KeyOps deny-by-default y el Worker reautoriza | PASS |
| Auditabilidad | Login, callback, rechazo y cambios administrativos generan eventos sin tokens/claims innecesarios | PASS |
| Privacidad | Solo issuer, subject y claims mínimos; no se almacena token OIDC en Airtable | PASS |
| Tres capas | `AuthRepository` y repositorios de usuarios ocultan OIDC/Airtable a presentación | PASS |
| Estado fiable | Deshabilitación KeyOps inmediata y estado corporativo revalidado en máximo cinco minutos | PASS |
| Testing/versionado | Descubrimiento/claims validados, contratos versionados y pruebas de ataques de redirección | PASS |
| Persistencia | Identidad autoritativa externa; autorización operativa persistente en Airtable | DEVIATION |

### Excepción constitucional temporal

| Campo | Decisión |
|---|---|
| Principios afectados | VII y XI: el proveedor OIDC sustituye a Airtable como fuente de identidad y estado corporativo |
| Alcance | Autenticación, identificador corporativo, vigencia y claims mínimos |
| Riesgo | Sesión activa durante un intervalo breve tras deshabilitación externa o divergencia de atributos |
| Mitigación | Sesión máxima/revalidación de cinco minutos, autorización Airtable por operación y cierre ante fallo de validación |
| Responsable | Seguridad |
| Caducidad | 2026-12-31; antes debe enmendarse la constitución o retirarse la integración |

## Project Structure

### Documentation (this feature)

```text
specs/007-identidad-usuarios-corporativos/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/mobile-api.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
worker/src/
├── identity/{OidcProviderPort,OidcHttpAdapter,oidcValidation}.ts
├── auth/{authorizationCodeFlow,corporateSession,authorize}.ts
├── airtable/UserRepository.ts
└── routes/v1/{auth,users}.ts

mobile/src/
├── data/repositories/{RestAuthRepository,RestUserRepository}.ts
├── domain/{model,ports,use-cases}/
└── presentation/{controllers,components/users}/

worker/tests/{unit,contract,integration,security}/
```

**Structure Decision**: El Worker actúa como cliente OIDC confidencial/BFF y conserva tokens corporativos fuera del cliente. La app usa la sesión KeyOps same-origin. Airtable gestiona acceso a KeyOps, nunca el directorio corporativo.

## Design Decisions

- `GET /v1/auth/login` crea state, nonce y PKCE S256 ligados a cookie transaccional breve; `/v1/auth/callback` valida issuer, audience, nonce, firma y redirect exacto.
- El callback usa `(issuer, subject)` como identidad estable, consulta `Users` y rechaza por defecto si no existe o está deshabilitada.
- La sesión web es cookie HttpOnly, Secure y SameSite=Lax; el Worker no expone refresh/access tokens OIDC al bundle.
- `Users` añade `corporateIssuer`, `corporateSubject` y `identityValidatedAt`; `loginIdentifier/displayName` son atributos de presentación, no claves.
- Deshabilitar en KeyOps invalida inmediatamente; deshabilitar en el IdP se refleja en máximo cinco minutos mediante revalidación/introspección o sesión corta. Si el proveedor no ofrece un mecanismo equivalente, falla el checkpoint.
- Administración crea/actualiza la autorización KeyOps y perfiles; no crea, modifica ni reactiva identidades en el directorio.
- Se impide retirar al último administrador efectivo y toda actualización usa control optimista/idempotencia y auditoría.

## Delivery and Validation

1. Validar OIDC, errores, CSRF/mix-up/open redirect y claims con proveedor simulado.
2. Validar alta repetida, cambio de perfil, autoelevación y último administrador contra Airtable de test.
3. Conectar tenant corporativo solo tras aprobar discovery URL, client registration, redirect URIs, claims y mecanismo de deshabilitación.
4. Probar usuario autorizado/no autorizado/deshabilitado y medir propagación menor o igual a cinco minutos.

