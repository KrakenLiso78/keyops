# Tasks: Publicación web móvil y acceso por perfil

**Input**: Design documents from `/specs/002-publicacion-web-acceso/`

**Tests**: Los tests son obligatorios por la constitución. En cada historia se escriben primero y deben demostrar el fallo esperado antes de implementar.

## Phase 1: Setup

**Purpose**: Crear el único Worker compartido y fijar versiones/configuración.

- [X] T001 Crear `.nvmrc` con Node 25.9.0 y alinear `engines`/`packageManager` en `mobile/package.json`
- [X] T002 Crear el proyecto TypeScript del Worker en `worker/package.json`, `worker/package-lock.json` y `worker/tsconfig.json` con Wrangler 4.115.0, Vitest 4.1.10 y scripts `test`, `dev`, `deploy` y `test:contract`
- [X] T003 Configurar `worker/wrangler.jsonc` con `compatibility_date`, activos `../mobile/dist`, fallback SPA y ejecución prioritaria de `/v1/*`
- [X] T004 [P] Crear ejemplos sin secretos en `worker/.dev.vars.example` y `mobile/.env.example` y comprobar exclusiones en `.gitignore`
- [X] T005 [P] Crear el router y respuesta de salud versionada en `worker/src/index.ts` y `worker/src/routes/v1/health.ts`

**Checkpoint**: `mobile/dist` y `/v1/health` se sirven desde `wrangler dev` sin credenciales reales.

## Phase 2: Foundational

**Purpose**: Infraestructura común que bloquea las historias de esta feature y las features 003–005.

- [X] T006 [P] Definir y validar bindings/secretos en `worker/src/config/env.ts` sin exponer valores en logs
- [X] T007 [P] Implementar errores, request ID y respuestas JSON controladas en `worker/src/http/ApiError.ts` y `worker/src/http/requestContext.ts`
- [X] T008 [P] Implementar `worker/src/airtable/AirtableClient.ts` con timeout, paginación, batching, manejo de 429 y redacción
- [X] T009 Crear schemas y mapper de usuario Airtable en `worker/src/airtable/userSchema.ts` y `worker/src/airtable/userMapper.ts`
- [X] T010 Implementar lectura de usuario por identificador/ID en `worker/src/airtable/UserRepository.ts`
- [X] T011 [P] Implementar firma/verificación HMAC y expiración en `worker/src/auth/sessionToken.ts`
- [X] T012 Implementar autenticación y autorización deny-by-default en `worker/src/auth/authenticate.ts` y `worker/src/auth/authorize.ts`
- [X] T013 [P] Crear fixtures y adaptador Airtable en memoria para tests del Worker en `worker/tests/fixtures/users.ts` y `worker/tests/support/InMemoryAirtable.ts`
- [X] T014 [P] Crear el contrato de trazabilidad de resultados en `worker/src/audit/AuditSink.ts` para que la feature 005 conecte su persistencia

**Checkpoint**: La infraestructura autentica, vuelve a cargar permisos y rechaza por defecto; aún no se declara superada la trazabilidad persistente de acceso.

## Phase 3: US-WEB-01 — Acceder según el perfil (P1)

**Goal**: Acceso remoto de usuarios habilitados y rechazo tanto visual como servidor.

**Independent Test**: Usuario válido, deshabilitado y perfiles distintos; la persistencia de sus eventos se completa con la feature 005.

### Tests

- [X] T015 [P] [US-WEB-01] Escribir tests unitarios fallidos de token, expiración, usuario deshabilitado y permisos en `worker/tests/unit/auth.test.ts`
- [X] T016 [P] [US-WEB-01] Escribir tests de contrato fallidos para `POST /v1/sessions` y `GET /v1/session` en `worker/tests/contract/session.contract.test.ts`
- [ ] T017 [P] [US-WEB-01] Escribir tests móviles fallidos de login, restauración, cierre y rutas protegidas en `mobile/tests/integration/auth-flow.test.tsx`
- [X] T018 [P] [US-WEB-01] Escribir test de seguridad fallido para secretos/errores genéricos en `worker/tests/security/session-redaction.test.ts`

### Implementation

- [X] T019 [US-WEB-01] Implementar creación/restauración de sesión conforme al contrato en `worker/src/routes/v1/sessions.ts`
- [X] T020 [US-WEB-01] Conectar autenticación y emisión de resultados auditables en `worker/src/index.ts` sin persistir cuerpos ni contraseñas
- [ ] T021 [P] [US-WEB-01] Actualizar schemas/mappers de sesión en `mobile/src/data/schemas/session.ts` y `mobile/src/data/mappers/sessionMapper.ts`
- [ ] T022 [US-WEB-01] Sustituir el alias fake por `RestAuthRepository` real en `mobile/src/data/repositories/RestAuthRepository.ts`
- [ ] T023 [US-WEB-01] Hacer `remote` el origen predeterminado y validar URL/modo en `mobile/src/composition/runtimeConfig.ts` y `mobile/src/composition/createAppDependencies.ts`
- [ ] T024 [US-WEB-01] Consolidar inyección y estado de sesión en `mobile/src/composition/DependenciesProvider.tsx`, `mobile/src/presentation/state/SessionProvider.tsx` y `mobile/src/presentation/state/AppProvider.tsx`
- [ ] T025 [US-WEB-01] Aplicar guardas por sesión/permiso a navegación directa en `mobile/app/(protected)/_layout.tsx` y rutas protegidas
- [ ] T026 [US-WEB-01] Limpiar token y estado sensible al cerrar/caducar sesión en `mobile/src/presentation/controllers/useSignInController.ts` y `mobile/src/data/session/SecureStoreSessionStore.ts`

**Checkpoint**: Acceso y autorización funcionan contra Worker; el criterio de evento persistente queda condicionado a la integración de feature 005.

## Phase 4: US-WEB-02 — Operar en un ambiente de demostración (P1)

**Goal**: Separar test/production y eliminar estado anterior al cambiar.

**Independent Test**: Cambiar ambiente invalida consultas/vistas y todas las peticiones posteriores llevan el nuevo ambiente.

### Tests

- [ ] T027 [P] [US-WEB-02] Escribir tests fallidos de reducción/reset y carrera de cambio de ambiente en `mobile/tests/unit/environment-state.test.ts`
- [ ] T028 [P] [US-WEB-02] Escribir test de componente fallido de identificación visible en `mobile/tests/component/environment-banner.test.tsx`

### Implementation

- [ ] T029 [US-WEB-02] Centralizar cambio y reset inmutable en `mobile/src/presentation/state/EnvironmentProvider.tsx` y `mobile/src/presentation/state/resetEnvironmentState.ts`
- [ ] T030 [US-WEB-02] Cancelar/ignorar respuestas del ambiente anterior en `mobile/src/data/http/EnvironmentRequestScope.ts` y controladores dependientes
- [ ] T031 [US-WEB-02] Mostrar ambiente y etiqueta de demostración en todo el chrome protegido desde `mobile/src/presentation/components/environment/index.tsx` y `mobile/src/presentation/components/chrome.tsx`

**Checkpoint**: Ningún dato visual del ambiente anterior sobrevive al cambio.

## Phase 5: US-WEB-03 — Utilizar la aplicación web desde móvil (P1)

**Goal**: Publicación navegable en ambos viewports sin controles muertos.

**Independent Test**: Recorrido de acceso, navegación y ambiente en 390 × 844 y 360 × 800.

### Tests

- [ ] T032 [P] [US-WEB-03] Escribir test de accesibilidad/navegación de controles visibles en `mobile/tests/accessibility/web-navigation.test.tsx`
- [ ] T033 [P] [US-WEB-03] Fijar Playwright Test 1.61.1 en `mobile/package.json`/`mobile/package-lock.json` y crear el E2E fallido de ambos viewports en `mobile/playwright.config.ts` y `mobile/tests/e2e/web-access.spec.ts`

### Implementation

- [ ] T034 [US-WEB-03] Retirar de la navegación MVP usuarios/consumo y reparar enlaces sin recorrido en `mobile/app/(protected)/_layout.tsx` y `mobile/src/presentation/components/chrome.tsx`
- [ ] T035 [US-WEB-03] Corregir overflow/foco/scroll en los componentes afectados bajo `mobile/src/presentation/components/`
- [ ] T036 [US-WEB-03] Añadir scripts reproducibles `export:web` y preview Worker en `mobile/package.json` y `worker/package.json`

**Checkpoint**: Preview web recorrible en ambos tamaños, sin desplazamiento horizontal ni controles inertes.

## Phase 6: Validation and release evidence

- [ ] T037 [P] Ejecutar y documentar `npm run validate` móvil y tests Worker en `specs/002-publicacion-web-acceso/quickstart.md`
- [ ] T038 Ejecutar bajo demanda la prueba de usuario persistente contra Airtable de test desde `worker/tests/integration/airtable-session.test.ts`
- [ ] T039 Publicar preview, recorrer ambos viewports y registrar URL/fecha/limitaciones en `specs/002-publicacion-web-acceso/quickstart.md`
- [ ] T040 Revalidar límites Free y revisar bundle/logs por secretos antes del checkpoint de la feature

## Dependencies & Execution Order

- T001–T005 → T006–T014 → historias.
- US-WEB-01 precede US-WEB-02 y US-WEB-03 porque aporta sesión y composición.
- La feature 003 reutiliza T001–T014. Las features 004–005 reutilizan además sesión/autorización.
- FR/SC de trazabilidad de acceso solo queda completamente aceptado después de conectar `AuditSink` en las tareas de feature 005; no cerrar 002 como plenamente conforme antes de ese checkpoint.

## Parallel Opportunities

- T004/T005 y T006–T008/T011/T013/T014 trabajan en ficheros distintos.
- Los tests T015–T018 pueden escribirse en paralelo antes de la implementación.
- T027/T028 y T032/T033 son pares paralelos.

## Incremental Strategy

1. Publicar salud + estáticos.
2. Completar acceso remoto y rutas protegidas.
3. Añadir separación de ambiente.
4. Validar navegador móvil y conectar auditoría 005 antes de declarar la feature completa.
