# Tasks: Identidad y usuarios corporativos

**Input**: Design documents from `/specs/007-identidad-usuarios-corporativos/`

**Tests**: Obligatorios por seguridad. Cada bloque se escribe primero y debe fallar antes de la implementación correspondiente.

## Phase 1: Setup

- [x] T001 Crear estructura de identidad y fixtures OIDC en `worker/src/identity/` y `worker/tests/fixtures/identity/`
- [x] T002 [P] Añadir bindings OIDC sin secretos al schema y ejemplo en `worker/src/config/env.ts` y `worker/.dev.vars.example`
- [x] T003 [P] Documentar registro de cliente, claims y propagación de baja en `worker/docs/corporate-identity-checkpoint.md`

## Phase 2: Foundational

- [x] T004 [P] Definir `OidcProviderPort` y DTO mínimos en `worker/src/identity/OidcProviderPort.ts`
- [x] T005 [P] Implementar discovery/JWKS/claims schemas en `worker/src/identity/oidcSchemas.ts`
- [x] T006 [P] Implementar state, nonce y PKCE S256 en `worker/src/auth/authorizationTransaction.ts`
- [x] T007 [P] Implementar cookies transaccional/sesión seguras en `worker/src/auth/corporateSession.ts`
- [x] T008 Crear stub OIDC con códigos/firmas/errores configurables en `worker/tests/support/OidcProviderStub.ts`
- [x] T009 Implementar adapter OIDC HTTP neutral en `worker/src/identity/OidcHttpAdapter.ts`
- [x] T010 Implementar validación issuer/audience/nonce/firma/redirect en `worker/src/identity/oidcValidation.ts`
- [x] T011 Definir el delta de esquema corporativo de `Users` en `worker/scripts/airtable/README.md` y evolucionar el repositorio por issuer/subject en `worker/src/airtable/UserRepository.ts`
- [x] T012 Conectar identidad y autorización en `worker/src/composition/createWorkerDependencies.ts`

**Checkpoint**: Flujo OIDC y autorización persistente pueden probarse con stub y Airtable de test.

## Phase 3: US-ID-01 — Acceder con identidad corporativa (P1)

**Goal**: Autenticar mediante OIDC y cortar accesos no autorizados/deshabilitados en máximo cinco minutos.

**Independent Test**: Identidad autorizada, desconocida y deshabilitada; ataques de callback y propagación temporal.

### Tests

- [x] T013 [P] [US-ID-01] Escribir tests fallidos de PKCE/state/nonce/expiración/un uso en `worker/tests/unit/authorizationTransaction.test.ts`
- [x] T014 [P] [US-ID-01] Escribir tests fallidos de issuer/audience/firma/redirect en `worker/tests/security/oidcValidation.test.ts`
- [x] T015 [P] [US-ID-01] Escribir contrato fallido de login/callback/session en `worker/tests/contract/corporate-auth.contract.test.ts`
- [x] T016 [P] [US-ID-01] Escribir tests fallidos de usuario desconocido/deshabilitado y deny-by-default en `worker/tests/unit/corporateAuthorization.test.ts`
- [x] T017 [P] [US-ID-01] Escribir test móvil fallido de redirect/restauración/cierre en `mobile/tests/integration/corporate-auth-flow.test.tsx`
- [x] T018 [P] [US-ID-01] Escribir test de redacción de tokens/claims/cookies en `worker/tests/security/oidc-redaction.test.ts`

### Implementation

- [x] T019 [US-ID-01] Implementar inicio OIDC y allowlist de retorno en `worker/src/routes/v1/auth.ts`
- [x] T020 [US-ID-01] Implementar callback, exchange y emisión de sesión KeyOps en `worker/src/routes/v1/auth.ts`
- [x] T021 [US-ID-01] Resolver autorización Airtable por issuer/subject en `worker/src/auth/authorize.ts`
- [x] T022 [US-ID-01] Implementar revalidación externa máxima de cinco minutos en `worker/src/auth/corporateSession.ts`
- [x] T023 [US-ID-01] Registrar acceso/rechazo/error sin tokens en `worker/src/routes/v1/auth.ts`
- [x] T024 [US-ID-01] Adaptar `RestAuthRepository` al redirect/cookie en `mobile/src/data/repositories/RestAuthRepository.ts`
- [x] T025 [US-ID-01] Conectar estados y cierre corporativo en `mobile/src/presentation/controllers/useSignInController.ts`

**Checkpoint**: Acceso completo con stub; validación corporativa requiere T041–T043.

## Phase 4: US-ID-02 — Gestionar usuarios y perfiles (P1)

**Goal**: Administrar autorización KeyOps sin duplicar identidad ni modificar el directorio.

**Independent Test**: Alta repetida, perfil, deshabilitación, autoelevación y último administrador.

### Tests

- [x] T026 [P] [US-ID-02] Escribir tests fallidos de unicidad issuer/subject y control optimista en `worker/tests/unit/authorizedUsers.test.ts`
- [x] T027 [P] [US-ID-02] Escribir tests fallidos de autoelevación/último admin/permisos en `worker/tests/security/userAdministration.test.ts`
- [x] T028 [P] [US-ID-02] Escribir contrato fallido de list/register/update en `worker/tests/contract/users.contract.test.ts`
- [x] T029 [P] [US-ID-02] Escribir integración Airtable fallida de persistencia entre procesos en `worker/tests/integration/airtable-authorized-users.test.ts`
- [x] T030 [P] [US-ID-02] Escribir tests móviles fallidos de estados/errores/perfiles en `mobile/tests/component/users/userAdministration.test.tsx`

### Implementation

- [x] T031 [US-ID-02] Implementar casos list/register/update con upsert seguro en `worker/src/users/authorizedUserService.ts`
- [x] T032 [US-ID-02] Aplicar deny-by-default, no autoelevación y último admin en `worker/src/users/userAdministrationPolicy.ts`
- [x] T033 [US-ID-02] Exponer rutas administrativas autorizadas en `worker/src/routes/v1/users.ts`
- [x] T034 [P] [US-ID-02] Añadir identidad corporativa al dominio/DTO móvil en `mobile/src/domain/model/user.ts` y `mobile/src/data/schemas/user.ts`
- [x] T035 [US-ID-02] Implementar `RestUserRepository` real en `mobile/src/data/repositories/RestUserRepository.ts`
- [x] T036 [US-ID-02] Conectar casos de uso y controlador en `mobile/src/domain/use-cases/users.ts` y `mobile/src/presentation/controllers/useUsersController.ts`
- [x] T037 [US-ID-02] Completar UI administrativa y confirmaciones en `mobile/src/presentation/components/users/index.tsx`
- [x] T038 [US-ID-02] Auditar alta/cambio/rechazo sin claims innecesarios en `worker/src/routes/v1/users.ts`

**Checkpoint**: Administración KeyOps completa con Airtable; no administra el directorio.

## Phase 5: Corporate validation

- [x] T039 [P] Ejecutar suites y documentar evidencia local en `specs/007-identidad-usuarios-corporativos/quickstart.md`
- [x] T040 Registrar excepción constitucional/owner/caducidad en `worker/docs/corporate-identity-checkpoint.md`
- [ ] T041 Obtener discovery, registro, claims y mecanismo de baja real en `worker/docs/corporate-identity-checkpoint.md`
- [ ] T042 Implementar configuración/adaptación concreta tras T041 en `worker/src/identity/CorporateOidcProviderAdapter.ts`
- [ ] T043 Ejecutar identidad válida/no autorizada/deshabilitada y medir ≤5 min en `worker/tests/integration/corporate-identity.pilot.test.ts`
- [ ] T044 Registrar evidencia de auditoría y cero tokens expuestos en `specs/007-identidad-usuarios-corporativos/quickstart.md`

## Dependencies & Execution Order

- Requiere la base Worker 002 y auditoría 005; puede avanzar en paralelo con 006.
- T001–T012 bloquean historias. US-ID-01 precede la UI administrativa; tests preceden implementación.
- T041 es checkpoint externo; T042–T044 no se cierran con stub.
- 008 requiere T043 para autorizar operaciones reales.

## Parallel Opportunities

- T002/T003, T004–T008 y los bloques de tests marcados [P] son paralelos.
- T034 puede avanzar con el contrato congelado mientras se implementa servidor.

## Incremental Strategy

1. Flujo OIDC seguro con stub.
2. Autorización persistente y sesión de cinco minutos.
3. Administración KeyOps.
4. Provider real y evidencia corporativa.
