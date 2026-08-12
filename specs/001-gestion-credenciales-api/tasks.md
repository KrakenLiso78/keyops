# Tareas: Gestión autónoma de credenciales API

**Input**: artefactos de diseño en `/specs/001-gestion-credenciales-api/`

**Prerrequisitos**: `spec.md`, `plan.md`, `research.md`, `data-model.md`,
`contracts/mobile-api.openapi.yaml` y `quickstart.md`

**Tests**: obligatorios por la constitución y por el criterio de este desglose:
cada tarea debe producir un cambio verificable en una sola sesión.

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: puede ejecutarse en paralelo cuando sus prerrequisitos estén listos;
  no modifica los mismos archivos que otra tarea paralela.
- **[Story]**: identifica la historia funcional a la que aporta la tarea.
- Las tareas de test de cada historia se escriben primero y deben fallar antes de
  iniciar sus tareas de implementación.
- Una tarea se cierra solo cuando pasa el comando de verificación indicado; no
  se arrastran fallos conocidos a la tarea siguiente.
- Los paths son relativos a la raíz del repositorio.

## Phase 1: Setup — proyecto reproducible

**Objetivo**: crear la aplicación Expo, fijar versiones y dejar disponibles los
comandos de calidad sin implementar todavía comportamiento funcional.

- [x] T001 Crear el proyecto Expo SDK 57 con template `default@sdk-57` en `mobile/package.json` y `mobile/app.json`; verificar desde `mobile/` con `npx expo-doctor@latest`
- [x] T002 Fijar Node `25.9.0` en `.nvmrc` y npm `11.12.1` en `mobile/package.json`; verificar con `node --version`, `npm --version` y `npm pkg get engines packageManager`
- [x] T003 Instalar Zod, módulos Expo 57, `expo-dev-client`, Jest 29.7, `jest-expo`, React Native Testing Library 14 y tipos en `mobile/package.json` y `mobile/package-lock.json`; verificar con `npm ci` y `npx expo install --check`
- [x] T004 Configurar nombre, scheme `keyops`, identificadores de aplicación, plugins y `experiments.typedRoutes` en `mobile/app.json`; verificar con `npx expo config --type public`
- [x] T005 Mover el routing inicial a `mobile/src/app/_layout.tsx` y `mobile/src/app/index.tsx`, y configurar includes/aliases en `mobile/tsconfig.json`; verificar con `npm run typecheck`
- [x] T006 [P] Configurar ESLint, Prettier y scripts `lint`, `format:check`, `typecheck` y `doctor` en `mobile/eslint.config.js`, `mobile/.prettierrc.json` y `mobile/package.json`; verificar ejecutando los cuatro scripts
- [x] T007 [P] Configurar Jest y el setup de React Native Testing Library en `mobile/jest.config.js`; verificar con un smoke test en `mobile/tests/smoke.test.ts`
- [x] T008 [P] Configurar exportación web local en `mobile/package.json`; verificar con `npx expo export --platform web`
- [x] T009 [P] Definir las variables públicas no sensibles y su validación en `mobile/.env.example` y `mobile/src/composition/runtimeConfig.ts`; verificar con `mobile/tests/unit/runtimeConfig.test.ts`
- [X] T010 [P] Incorporar Inter con su licencia y una copia optimizada del logo en `mobile/assets/fonts/`, `mobile/assets/fonts/LICENSE.txt` y `mobile/assets/images/keyops-logo.png`; verificar carga y dimensiones con `mobile/tests/unit/assets/assets.test.ts`

**Checkpoint**: `npm ci`, doctor, lint, format, typecheck y el smoke test pasan
sin código de negocio.

---

## Phase 2: Foundational — arquitectura y límites compartidos

**Objetivo**: construir los cimientos que bloquean todas las historias: sistema
de diseño, dominio puro, contratos, HTTP seguro, sesión, reducers y composición.

**CRÍTICO**: ninguna historia empieza hasta completar esta fase.

### Tests fundacionales — escribir y comprobar que fallan

- [X] T011 [P] Escribir pruebas de conversión de colores, tipografía, espaciado y estados de `DESIGN.md` en `mobile/tests/unit/presentation/designTokens.test.ts`; verificar con `npm test -- designTokens.test.ts`
- [X] T012 [P] Escribir pruebas de accesibilidad para botones, inputs y layout base en `mobile/tests/component/presentation/baseControls.test.tsx`; verificar con `npm test -- baseControls.test.tsx`
- [X] T013 [P] Escribir pruebas de carga, vacío, error persistente, badge de estado y aviso de Producción en `mobile/tests/component/presentation/feedbackComponents.test.tsx`; verificar con `npm test -- feedbackComponents.test.tsx`
- [X] T014 [P] Escribir pruebas de invariantes para usuario, aplicación, credencial, entrega, auditoría y uso en `mobile/tests/unit/domain/domainModels.test.ts`; verificar con `npm test -- domainModels.test.ts`
- [X] T015 [P] Escribir pruebas de la matriz de permisos por perfil en `mobile/tests/unit/domain/permittedActions.test.ts`; verificar con `npm test -- permittedActions.test.ts`
- [X] T016 [P] Escribir pruebas de todas las transiciones válidas e inválidas de credencial en `mobile/tests/unit/domain/credentialTransitions.test.ts`; verificar con `npm test -- credentialTransitions.test.ts`
- [X] T017 [P] Escribir pruebas de `contractVersion`, fechas, ambiente y envelope de error en `mobile/tests/contract/commonSchemas.test.ts`; verificar con `npm test -- commonSchemas.test.ts`
- [X] T018 [P] Escribir pruebas de redacción, timeout, 401, aborto y rechazo de contrato incompatible en `mobile/tests/unit/data/FetchHttpClient.test.ts`; verificar con `npm test -- FetchHttpClient.test.ts`
- [X] T019 [P] Escribir pruebas que limiten SecureStore a tokens y cubran lectura, error y borrado en `mobile/tests/unit/data/SecureStoreSessionStore.test.ts`; verificar con `npm test -- SecureStoreSessionStore.test.ts`
- [X] T020 [P] Escribir pruebas de los reducers de consulta y operación sin éxito optimista en `mobile/tests/unit/presentation/screenReducers.test.ts`; verificar con `npm test -- screenReducers.test.ts`
- [X] T021 [P] Escribir pruebas de fixtures sintéticas para ambos ambientes, perfiles y estados, sin secretos prohibidos, en `mobile/tests/unit/data/fakeSeed.test.ts`; verificar con `npm test -- fakeSeed.test.ts`

### Implementación fundacional

- [X] T022 Implementar los tokens de `DESIGN.md` en `mobile/src/presentation/design-system/tokens.ts` y `mobile/src/presentation/design-system/typography.ts`; hacer pasar `mobile/tests/unit/presentation/designTokens.test.ts`
- [X] T023 Implementar `Screen`, `AppText`, `Button` y `TextField` accesibles en `mobile/src/presentation/components/base.tsx`; hacer pasar `mobile/tests/component/presentation/baseControls.test.tsx`
- [X] T024 Implementar `LoadingState`, `EmptyState`, `PersistentError`, `CredentialBadge` y `ProductionBanner` en `mobile/src/presentation/components/feedback/`; hacer pasar `mobile/tests/component/presentation/feedbackComponents.test.tsx`
- [X] T025 [P] Implementar tipos comunes, `AuthenticatedUser`, `Institution`, `ApiRole` e `IntegratedApplication` en `mobile/src/domain/model/common.ts`, `mobile/src/domain/model/user.ts` y `mobile/src/domain/model/application.ts`; hacer pasar la parte correspondiente de `mobile/tests/unit/domain/domainModels.test.ts`
- [X] T026 [P] Implementar `Credential`, `CredentialVersion`, `CredentialStateChange` y `ProtectedDelivery` en `mobile/src/domain/model/credential.ts` y `mobile/src/domain/model/delivery.ts`; hacer pasar la parte correspondiente de `mobile/tests/unit/domain/domainModels.test.ts`
- [X] T027 [P] Implementar `AuditEvent`, `UsageSummary`, `OperationReceipt` y `Page<T>` en `mobile/src/domain/model/audit.ts`, `mobile/src/domain/model/usage.ts` y `mobile/src/domain/model/page.ts`; completar `mobile/tests/unit/domain/domainModels.test.ts`
- [X] T028 Implementar la política de acciones por perfil, permiso y estado en `mobile/src/domain/policies/permittedActions.ts`; hacer pasar `mobile/tests/unit/domain/permittedActions.test.ts`
- [X] T029 Implementar la máquina de estados y la obligación de motivo en `mobile/src/domain/policies/credentialTransitions.ts`; hacer pasar `mobile/tests/unit/domain/credentialTransitions.test.ts`
- [X] T030 [P] Definir `AuthRepository` y `ApplicationRepository` en `mobile/src/domain/ports/AuthRepository.ts` y `mobile/src/domain/ports/ApplicationRepository.ts`; verificar con `npm run typecheck`
- [X] T031 [P] Definir `CredentialRepository`, `AuditRepository`, `UsageRepository` y `UserRepository` en `mobile/src/domain/ports/`; verificar con `npm run typecheck`
- [X] T032 Implementar schemas Zod comunes, versión y errores en `mobile/src/data/schemas/common.ts` y `mobile/src/data/schemas/error.ts`; hacer pasar `mobile/tests/contract/commonSchemas.test.ts`
- [X] T033 Implementar HTTP, timeout, aborto, normalización de errores y redacción en `mobile/src/data/http/FetchHttpClient.ts`, `mobile/src/data/http/ApiError.ts` y `mobile/src/data/http/redact.ts`; hacer pasar `mobile/tests/unit/data/FetchHttpClient.test.ts`
- [X] T034 Implementar el almacén async de tokens en `mobile/src/data/session/SecureStoreSessionStore.ts`; hacer pasar `mobile/tests/unit/data/SecureStoreSessionStore.test.ts`
- [X] T035 Implementar reducers inmutables de consulta y operación en `mobile/src/presentation/state/queryReducer.ts` y `mobile/src/presentation/state/operationReducer.ts`; hacer pasar `mobile/tests/unit/presentation/screenReducers.test.ts`
- [X] T036 Implementar datos sintéticos y el punto de composición fake en `mobile/src/data/fake/seed.ts`, `mobile/src/composition/createAppDependencies.ts` y `mobile/src/composition/DependenciesProvider.tsx`; hacer pasar `mobile/tests/unit/data/fakeSeed.test.ts` y `npm run typecheck`

**Checkpoint**: las tres capas compilan, UI no importa red/storage, el dominio no
importa React Native/Expo y todos los tests fundacionales pasan.

---

## Phase 3: US-01 — Acceder a KeyOps según perfil (P1)

**Objetivo**: autenticar usuarios habilitados, rechazar accesos no válidos,
restaurar/cerrar sesión y proteger rutas por perfil.

**Prueba independiente**: usuario analista habilitado entra; usuario inexistente
o deshabilitado recibe rechazo seguro; auditor entra sin acciones operativas;
cerrar sesión elimina tokens y estado.

### Tests — escribir y comprobar que fallan

- [X] T037 [P] [US1] Escribir contract tests para `CreateSessionRequest`, `SessionResponse` y `SessionView` en `mobile/tests/contract/sessionSchemas.test.ts`; verificar con `npm test -- sessionSchemas.test.ts`
- [X] T038 [P] [US1] Escribir pruebas de iniciar, restaurar, caducar y cerrar sesión en `mobile/tests/unit/domain/sessionUseCases.test.ts`; verificar con `npm test -- sessionUseCases.test.ts`
- [X] T039 [P] [US1] Escribir pruebas de estados y protección de rutas de acceso en `mobile/tests/component/auth/signInFlow.test.tsx`; verificar fallo con `npm test -- signInFlow.test.tsx`
- [X] T040 [P] [US1] Definir el recorrido autorizado y rechazado en `mobile/tests/integration/auth/signInFlow.test.tsx`; verificar que falla antes de implementar con Jest

### Implementación

- [X] T041 [US1] Implementar schemas, mapper y `RestAuthRepository` para `/v1/sessions` y `/v1/session` en `mobile/src/data/schemas/session.ts`, `mobile/src/data/mappers/sessionMapper.ts` y `mobile/src/data/repositories/RestAuthRepository.ts`; hacer pasar `mobile/tests/contract/sessionSchemas.test.ts`
- [X] T042 [US1] Implementar `FakeAuthRepository` y casos de uso de iniciar, restaurar y cerrar sesión en `mobile/src/data/fake/FakeAuthRepository.ts` y `mobile/src/domain/use-cases/auth/`; hacer pasar `mobile/tests/unit/domain/sessionUseCases.test.ts`
- [X] T043 [US1] Implementar `SessionProvider` y `useSignInController` en `mobile/src/presentation/state/SessionProvider.tsx` y `mobile/src/presentation/controllers/useSignInController.ts`; hacer pasar los estados de `mobile/tests/component/auth/signInFlow.test.tsx`
- [X] T044 [US1] Implementar `mobile/src/app/(auth)/sign-in.tsx` y la protección/redirect de `mobile/src/app/_layout.tsx`; completar las pruebas de componente e integración de acceso

**Checkpoint**: US-01 funciona de forma aislada con fake y contrato de sesión.

---

## Phase 4: US-13 — Operar por ambiente (P1)

**Objetivo**: separar inequívocamente Pruebas y Producción y descartar todo
estado dependiente al cambiar.

**Prueba independiente**: al cambiar de Pruebas a Producción se vuelve al
inventario, se cancelan solicitudes, se ignora una respuesta tardía y se
mantiene la misma matriz de permisos.

### Tests — escribir y comprobar que fallan

- [X] T045 [P] [US13] Escribir pruebas de selección, bloqueo durante operación y reset de ambiente en `mobile/tests/unit/presentation/environmentState.test.ts`; verificar con `npm test -- environmentState.test.ts`
- [X] T046 [P] [US13] Escribir pruebas del selector, aviso de Producción y texto accesible en `mobile/tests/component/environment/environmentSelector.test.tsx`; verificar fallo con `npm test -- environmentSelector.test.tsx`
- [X] T047 [P] [US13] Escribir pruebas de ambiente en URL, aborto e ignorado de respuesta tardía en `mobile/tests/integration/data/environmentRequests.test.ts`; verificar con `npm test -- environmentRequests.test.ts`
- [X] T048 [P] [US13] Definir el recorrido Pruebas → Producción sin mezcla en `mobile/tests/integration/environment/switchEnvironment.test.tsx`; verificar que falla antes de implementar con Jest

### Implementación

- [X] T049 [US13] Implementar `EnvironmentProvider` y el coordinador de reset en `mobile/src/presentation/state/EnvironmentProvider.tsx` y `mobile/src/presentation/state/resetEnvironmentState.ts`; hacer pasar `mobile/tests/unit/presentation/environmentState.test.ts`
- [X] T050 [P] [US13] Implementar `EnvironmentTabs` y `ProductionEnvironmentAlert` en `mobile/src/presentation/components/environment/`; hacer pasar `mobile/tests/component/environment/environmentSelector.test.tsx`
- [X] T051 [P] [US13] Implementar scope ambiental, secuencia de petición y cancelación en `mobile/src/data/http/EnvironmentRequestScope.ts`; hacer pasar `mobile/tests/integration/data/environmentRequests.test.ts`
- [X] T052 [US13] Integrar ambiente, bloqueo y retorno al inventario en `mobile/src/app/(protected)/_layout.tsx`; completar la prueba de integración de ambiente

**Checkpoint**: ningún dato o respuesta de un ambiente aparece en el otro.

---

## Phase 5: US-02 — Consultar inventario (P1)

**Objetivo**: listar, buscar, filtrar, ordenar y paginar aplicaciones del ambiente
activo con estados carga, vacío y error.

**Prueba independiente**: fixtures con varios estados responden a los tres
campos de búsqueda, filtro, orden y paginación; una consulta sin coincidencias
mantiene los criterios visibles.

### Tests — escribir y comprobar que fallan

- [X] T053 [P] [US2] Escribir contract e integration tests de `ApplicationPage` y query params de `listApplications` en `mobile/tests/contract/applicationList.test.ts`; verificar con `npm test -- applicationList.test.ts`
- [X] T054 [P] [US2] Escribir pruebas de búsqueda, filtros, orden y paginación del caso de uso en `mobile/tests/unit/domain/listApplications.test.ts`; verificar con `npm test -- listApplications.test.ts`
- [X] T055 [P] [US2] Escribir pruebas de tarjetas y estados carga/vacío/error en `mobile/tests/component/applications/applicationListScreen.test.tsx`; verificar fallo con `npm test -- applicationListScreen.test.tsx`

### Implementación

- [X] T056 [US2] Implementar schema, mapper y repositorios remote/fake de inventario en `mobile/src/data/schemas/applicationList.ts`, `mobile/src/data/mappers/applicationListMapper.ts`, `mobile/src/data/repositories/RestApplicationRepository.ts` y `mobile/src/data/fake/FakeApplicationRepository.ts`; hacer pasar `mobile/tests/contract/applicationList.test.ts`
- [X] T057 [US2] Implementar `listApplications` y `useApplicationListController` en `mobile/src/domain/use-cases/applications/listApplications.ts` y `mobile/src/presentation/controllers/useApplicationListController.ts`; hacer pasar `mobile/tests/unit/domain/listApplications.test.ts`
- [X] T058 [P] [US2] Implementar `ApplicationCard`, `ApplicationSearch`, `ApplicationFilters` y `PaginationControls` en `mobile/src/presentation/components/applications/`; hacer pasar la parte de componentes de `mobile/tests/component/applications/applicationListScreen.test.tsx`
- [X] T059 [US2] Implementar la ruta `mobile/src/app/(protected)/applications/index.tsx`; completar `mobile/tests/component/applications/applicationListScreen.test.tsx`

**Checkpoint**: US-02 localiza aplicaciones sin depender del detalle ni de una
operación de credencial.

---

## Phase 6: US-03 — Consultar detalle de aplicación (P1)

**Objetivo**: mostrar configuración, Client ID, historial y acciones permitidas,
sin exponer Client Secret.

**Prueba independiente**: una aplicación existente muestra sus datos en el orden
de diseño; una inexistente devuelve 404 seguro; ningún tipo, fixture o pantalla
contiene Client Secret.

### Tests — escribir y comprobar que fallan

- [X] T060 [P] [US3] Escribir contract e integration tests de `ApplicationDetailResponse` y `getApplication` en `mobile/tests/contract/applicationDetail.test.ts`; verificar con `npm test -- applicationDetail.test.ts`
- [X] T061 [P] [US3] Escribir pruebas de detalle y cálculo de acciones por perfil/estado en `mobile/tests/unit/domain/getApplicationDetail.test.ts`; verificar con `npm test -- getApplicationDetail.test.ts`
- [X] T062 [P] [US3] Escribir pruebas de orden visual, 404, historial y Client ID en `mobile/tests/component/applications/applicationDetailScreen.test.tsx`; verificar fallo con `npm test -- applicationDetailScreen.test.tsx`
- [X] T063 [P] [US3] Escribir una regresión que rechace `clientSecret` en DTO, fixtures y salida renderizada en `mobile/tests/security/noClientSecret.test.ts`; verificar con `npm test -- noClientSecret.test.ts`

### Implementación

- [X] T064 [US3] Implementar schema, mapper y carga remote/fake de detalle en `mobile/src/data/schemas/applicationDetail.ts`, `mobile/src/data/mappers/applicationDetailMapper.ts` y los métodos de `RestApplicationRepository.ts`/`FakeApplicationRepository.ts`; hacer pasar `mobile/tests/contract/applicationDetail.test.ts`
- [X] T065 [US3] Implementar `getApplicationDetail` y `useApplicationDetailController` en `mobile/src/domain/use-cases/applications/getApplicationDetail.ts` y `mobile/src/presentation/controllers/useApplicationDetailController.ts`; hacer pasar `mobile/tests/unit/domain/getApplicationDetail.test.ts`
- [X] T066 [P] [US3] Implementar cabecera, credencial, información operativa e historial en `mobile/src/presentation/components/applications/ApplicationDetail.tsx`; hacer pasar `mobile/tests/security/noClientSecret.test.ts`
- [X] T067 [US3] Implementar `mobile/src/app/(protected)/applications/[applicationId]/index.tsx`; completar `mobile/tests/component/applications/applicationDetailScreen.test.tsx`

**Checkpoint**: el detalle es utilizable y seguro antes de habilitar comandos.

---

## Phase 7: US-04 — Emitir, entregar y activar (P1)

**Objetivo**: completar el primer flujo crítico vertical con idempotencia,
resultado autoritativo, enlace y OTP separados y auditoría.

**Prueba independiente**: una aplicación sin credencial pasa a activa y muestra
enlace/OTP durante dos minutos; doble pulsación no duplica; una aplicación activa
o un fallo conserva un estado coherente.

### Tests — escribir y comprobar que fallan

- [X] T068 [P] [US4] Escribir contract tests de `ProtectedDelivery` y emisión `CredentialOperationResponse` en `mobile/tests/contract/issueCredential.test.ts`; verificar fallo con `npm test -- issueCredential.test.ts`
- [X] T069 [P] [US4] Escribir pruebas del caso de uso de emisión, precondición y fallo atómico en `mobile/tests/unit/domain/issueCredential.test.ts`; verificar fallo con `npm test -- issueCredential.test.ts`
- [X] T070 [P] [US4] Escribir pruebas de `Idempotency-Key`, doble pulsación y último estado confirmado en `mobile/tests/unit/presentation/credentialOperationController.test.ts`; verificar fallo con `npm test -- credentialOperationController.test.ts`
- [X] T071 [P] [US4] Escribir pruebas de confirmación, resultado, OTP, enlace, expiración, portapapeles y `Share` en `mobile/tests/component/credentials/issueCredentialScreen.test.tsx`; verificar fallo con `npm test -- issueCredentialScreen.test.tsx`
- [X] T072 [P] [US4] Definir el recorrido completo de emisión en `mobile/tests/integration/credentials/issueCredentialFlow.test.tsx`; verificar que falla antes de implementar con Jest

### Implementación

- [X] T073 [US4] Implementar schemas, mapper y emisión remote/fake en `mobile/src/data/schemas/credentialOperation.ts`, `mobile/src/data/mappers/credentialOperationMapper.ts`, `mobile/src/data/repositories/RestCredentialRepository.ts` y `mobile/src/data/fake/FakeCredentialRepository.ts`; hacer pasar `mobile/tests/contract/issueCredential.test.ts`
- [X] T074 [US4] Implementar `issueCredential` en `mobile/src/domain/use-cases/credentials/issueCredential.ts`; hacer pasar `mobile/tests/unit/domain/issueCredential.test.ts`
- [X] T075 [US4] Implementar `useCredentialOperationController` con idempotencia y estado confirmado en `mobile/src/presentation/controllers/useCredentialOperationController.ts`; hacer pasar `mobile/tests/unit/presentation/credentialOperationController.test.ts`
- [X] T076 [P] [US4] Implementar confirmación, resultado, `DeliveryLinkCard` y `OtpCard` en `mobile/src/presentation/components/credentials/`; hacer pasar las aserciones visuales de `mobile/tests/component/credentials/issueCredentialScreen.test.tsx`
- [X] T077 [US4] Implementar emisión, privacidad en background, bloqueo de captura, copia y share separado en `mobile/src/app/(protected)/applications/[applicationId]/operation.tsx`; completar las pruebas de componente e integración de emisión

**Checkpoint**: primer corte demostrable end-to-end; aún no es el MVP P1 completo.

---

## Phase 8: US-05 — Regenerar credenciales (P1)

**Objetivo**: rotar una credencial activa sin coexistencia y preservar la versión
vigente cuando falle.

**Prueba independiente**: éxito crea una nueva versión activa y rota la previa;
sin credencial se rechaza; el fallo mantiene la anterior activa y permite
reintento seguro.

### Tests — escribir y comprobar que fallan

- [X] T078 [P] [US5] Escribir contract tests de `regenerateCredential` y fallo seguro en `mobile/tests/contract/regenerateCredential.test.ts`; verificar fallo con `npm test -- regenerateCredential.test.ts`
- [X] T079 [P] [US5] Escribir pruebas de rotación, versión previa y conservación ante fallo en `mobile/tests/unit/domain/regenerateCredential.test.ts`; verificar fallo con `npm test -- regenerateCredential.test.ts`
- [X] T080 [P] [US5] Escribir pruebas del resultado de regeneración y mensaje de credencial anterior activa en `mobile/tests/component/credentials/regenerateCredentialScreen.test.tsx`; verificar fallo con `npm test -- regenerateCredentialScreen.test.tsx`
- [X] T081 [P] [US5] Definir el flujo determinista de regeneración fallida en `mobile/tests/integration/credentials/regenerateFailure.test.tsx`; verificar que falla antes de implementar con Jest

### Implementación

- [X] T082 [US5] Implementar respuesta, error y métodos remote/fake de regeneración en `mobile/src/data/schemas/credentialOperation.ts`, `mobile/src/data/repositories/RestCredentialRepository.ts` y `mobile/src/data/fake/FakeCredentialRepository.ts`; hacer pasar `mobile/tests/contract/regenerateCredential.test.ts`
- [X] T083 [US5] Implementar `regenerateCredential` en `mobile/src/domain/use-cases/credentials/regenerateCredential.ts`; hacer pasar `mobile/tests/unit/domain/regenerateCredential.test.ts`
- [X] T084 [US5] Añadir la variante `regenerate` al controlador en `mobile/src/presentation/controllers/useCredentialOperationController.ts`; hacer pasar las pruebas de estado de US-05
- [X] T085 [US5] Integrar regeneración y fallo seguro en `mobile/src/app/(protected)/applications/[applicationId]/operation.tsx`; completar las pruebas de componente e integración de regeneración

**Checkpoint**: la rotación queda probada sin depender de intervención técnica.

---

## Phase 9: US-06 — Suspender y reactivar (P1)

**Objetivo**: permitir transiciones temporales válidas con motivo obligatorio.

**Prueba independiente**: activa → suspendida → activa funciona y se audita;
sin motivo o desde revocada se rechaza sin cambiar el estado confirmado.

### Tests — escribir y comprobar que fallan

- [X] T086 [P] [US6] Escribir contract tests de suspensión/reactivación y `ReasonCommand` en `mobile/tests/contract/suspendReactivateCredential.test.ts`; verificar fallo con `npm test -- suspendReactivateCredential.test.ts`
- [X] T087 [P] [US6] Escribir pruebas del caso de uso de suspensión en `mobile/tests/unit/domain/suspendCredential.test.ts`; verificar fallo con `npm test -- suspendCredential.test.ts`
- [X] T088 [P] [US6] Escribir pruebas del caso de uso de reactivación en `mobile/tests/unit/domain/reactivateCredential.test.ts`; verificar fallo con `npm test -- reactivateCredential.test.ts`
- [X] T089 [P] [US6] Escribir pruebas de formulario de motivo y acciones por estado en `mobile/tests/component/credentials/suspendReactivateScreen.test.tsx`; verificar fallo con `npm test -- suspendReactivateScreen.test.tsx`

### Implementación

- [X] T090 [US6] Implementar schema y métodos remote/fake de suspensión/reactivación en `mobile/src/data/schemas/reasonCommand.ts`, `mobile/src/data/repositories/RestCredentialRepository.ts` y `mobile/src/data/fake/FakeCredentialRepository.ts`; hacer pasar `mobile/tests/contract/suspendReactivateCredential.test.ts`
- [X] T091 [P] [US6] Implementar `suspendCredential` en `mobile/src/domain/use-cases/credentials/suspendCredential.ts`; hacer pasar `mobile/tests/unit/domain/suspendCredential.test.ts`
- [X] T092 [P] [US6] Implementar `reactivateCredential` en `mobile/src/domain/use-cases/credentials/reactivateCredential.ts`; hacer pasar `mobile/tests/unit/domain/reactivateCredential.test.ts`
- [X] T093 [US6] Añadir variantes suspend/reactivate y validación de motivo en `mobile/src/presentation/controllers/useCredentialOperationController.ts`; verificar con las pruebas de US-06
- [X] T094 [US6] Integrar formulario y resultados en `mobile/src/app/(protected)/applications/[applicationId]/operation.tsx`; completar `mobile/tests/component/credentials/suspendReactivateScreen.test.tsx`

**Checkpoint**: las transiciones temporales son independientes de regeneración y
revocación.

---

## Phase 10: US-07 — Revocar credenciales (P1)

**Objetivo**: revocar de forma terminal desde activa o suspendida únicamente con
perfil autorizado, motivo y confirmación irreversible.

**Prueba independiente**: analista no ve la acción; senior/admin revoca; repetir
la revocación se rechaza y la credencial no puede reactivarse.

### Tests — escribir y comprobar que fallan

- [X] T095 [P] [US7] Escribir contract tests de `revokeCredential`, 403 y conflicto terminal en `mobile/tests/contract/revokeCredential.test.ts`; verificar fallo con `npm test -- revokeCredential.test.ts`
- [X] T096 [P] [US7] Escribir pruebas de permiso, motivo y transición terminal en `mobile/tests/unit/domain/revokeCredential.test.ts`; verificar fallo con `npm test -- revokeCredential.test.ts`
- [X] T097 [P] [US7] Escribir pruebas de ocultación por perfil y confirmación irreversible en `mobile/tests/component/credentials/revokeCredentialScreen.test.tsx`; verificar fallo con `npm test -- revokeCredentialScreen.test.tsx`
- [X] T098 [P] [US7] Definir el recorrido senior y el rechazo del analista en `mobile/tests/integration/credentials/revokeCredentialFlow.test.tsx`; verificar que falla antes de implementar con Jest

### Implementación

- [X] T099 [US7] Implementar métodos remote/fake y errores de revocación en `mobile/src/data/repositories/RestCredentialRepository.ts` y `mobile/src/data/fake/FakeCredentialRepository.ts`; hacer pasar `mobile/tests/contract/revokeCredential.test.ts`
- [X] T100 [US7] Implementar `revokeCredential` en `mobile/src/domain/use-cases/credentials/revokeCredential.ts`; hacer pasar `mobile/tests/unit/domain/revokeCredential.test.ts`
- [X] T101 [US7] Implementar `RevokeConfirmation` en `mobile/src/presentation/components/credentials/RevokeConfirmation.tsx`; hacer pasar `mobile/tests/component/credentials/revokeCredentialScreen.test.tsx`
- [X] T102 [US7] Integrar la variante revoke y permisos en `mobile/src/app/(protected)/applications/[applicationId]/operation.tsx`; completar la prueba de integración de revocación

**Checkpoint**: el ciclo de vida P1 está completo; falta cerrar su evidencia
transversal de auditoría.

---

## Phase 11: US-08 — Registrar automáticamente la auditoría (P1)

**Objetivo**: exigir evidencia auditable para accesos, consultas y comandos
exitosos, fallidos o rechazados, sin confiar en datos generados por el móvil.

**Prueba independiente**: cada operación P1 produce `requestId`, resultado y
`auditEventId` cuando corresponde; actor, IP y hora proceden del servidor/fake y
ningún error contiene secretos.

### Tests — escribir y comprobar que fallan

- [X] T103 [P] [US8] Escribir pruebas del validador de evidencia auditable para éxito, fallo y rechazo en `mobile/tests/unit/domain/auditEvidence.test.ts`; verificar fallo con `npm test -- auditEvidence.test.ts`
- [X] T104 [P] [US8] Escribir una matriz de cobertura de accesos, consultas y comandos P1 en `mobile/tests/integration/p1AuditCoverage.test.ts`; verificar fallo con `npm test -- p1AuditCoverage.test.ts`

### Implementación

- [X] T105 [US8] Implementar `requireAuditEvidence` sin fabricar actor/IP/hora en `mobile/src/domain/policies/auditEvidence.ts`; hacer pasar `mobile/tests/unit/domain/auditEvidence.test.ts`
- [X] T106 [US8] Integrar `requestId`, `auditEventId` y resultado en mappers y repositorios P1 bajo `mobile/src/data/mappers/`; hacer pasar los casos del stub local de `mobile/tests/integration/p1AuditCoverage.test.ts`
- [X] T107 [US8] Implementar resultados sintéticos exitosos, fallidos y rechazados en `mobile/src/data/fake/FakeAuditRecorder.ts` y conectarlos desde los repositorios fake; completar la matriz de `mobile/tests/integration/p1AuditCoverage.test.ts`
- [X] T108 [US8] Ejecutar todo P1 y registrar evidencia repetible en `mobile/docs/validation/p1-audit.md`; verificar con `npm test -- --runInBand` y la exportación web local

**Checkpoint MVP P1**: US-01, US-13 y US-02 a US-08 funcionan y son auditables.

---

## Phase 12: US-09 — Solicitar una nueva entrega (P2)

**Objetivo**: generar un enlace y OTP nuevos para una credencial activa sin
descargar el ZIP ni cambiar su estado.

**Prueba independiente**: activa genera una nueva entrega; ausente o revocada se
rechaza; enlace y OTP permanecen separados y efímeros.

### Tests — escribir y comprobar que fallan

- [X] T109 [P] [US9] Escribir contract tests de `createCredentialDelivery` en `mobile/tests/contract/createCredentialDelivery.test.ts`; verificar fallo con `npm test -- createCredentialDelivery.test.ts`
- [X] T110 [P] [US9] Escribir pruebas de precondiciones y estado inalterado en `mobile/tests/unit/domain/createCredentialDelivery.test.ts`; verificar fallo con `npm test -- createCredentialDelivery.test.ts`
- [X] T111 [P] [US9] Escribir pruebas de nueva entrega y rechazo en `mobile/tests/component/credentials/createDeliveryScreen.test.tsx`; verificar fallo con `npm test -- createDeliveryScreen.test.tsx`
- [X] T112 [P] [US9] Escribir regresión de enlace/OTP separados, clipboard y expiración en `mobile/tests/security/deliverySeparation.test.ts`; verificar fallo con `npm test -- deliverySeparation.test.ts`

### Implementación

- [X] T113 [US9] Implementar método remote/fake de nueva entrega en `mobile/src/data/repositories/RestCredentialRepository.ts` y `mobile/src/data/fake/FakeCredentialRepository.ts`; hacer pasar `mobile/tests/contract/createCredentialDelivery.test.ts`
- [X] T114 [US9] Implementar `createCredentialDelivery` en `mobile/src/domain/use-cases/credentials/createCredentialDelivery.ts`; hacer pasar `mobile/tests/unit/domain/createCredentialDelivery.test.ts`
- [X] T115 [US9] Añadir la variante deliver al controlador y componentes de resultado en `mobile/src/presentation/controllers/useCredentialOperationController.ts` y `mobile/src/presentation/components/credentials/`; hacer pasar `mobile/tests/security/deliverySeparation.test.ts`
- [X] T116 [US9] Integrar `Generar nueva entrega` en detalle/operación bajo `mobile/src/app/(protected)/applications/[applicationId]/`; completar `mobile/tests/component/credentials/createDeliveryScreen.test.tsx`

**Checkpoint**: US-09 reutiliza la entrega segura sin reabrir la emisión.

---

## Phase 13: US-10 — Registrar información de gestión (P2)

**Objetivo**: consultar y actualizar contacto técnico y solicitud/ticket sin
mezclar esos datos con el motivo obligatorio de una transición.

**Prueba independiente**: guardar y recargar contexto válido funciona; limpiar
campos opcionales funciona; un contacto inválido se rechaza.

### Tests — escribir y comprobar que fallan

- [X] T117 [P] [US10] Escribir contract tests de `ManagementContextPatch/Response` en `mobile/tests/contract/managementContext.test.ts`; verificar fallo con `npm test -- managementContext.test.ts`
- [X] T118 [P] [US10] Escribir pruebas de normalización y validación del contexto en `mobile/tests/unit/domain/updateManagementContext.test.ts`; verificar fallo con `npm test -- updateManagementContext.test.ts`
- [X] T119 [P] [US10] Escribir pruebas del formulario, errores y recarga en `mobile/tests/component/applications/managementContextForm.test.tsx`; verificar fallo con `npm test -- managementContextForm.test.tsx`

### Implementación

- [X] T120 [US10] Implementar schema, mapper y PATCH remote/fake en `mobile/src/data/schemas/managementContext.ts`, `mobile/src/data/mappers/managementContextMapper.ts` y los repositorios de aplicación; hacer pasar `mobile/tests/contract/managementContext.test.ts`
- [X] T121 [US10] Implementar `updateManagementContext` en `mobile/src/domain/use-cases/applications/updateManagementContext.ts`; hacer pasar `mobile/tests/unit/domain/updateManagementContext.test.ts`
- [X] T122 [P] [US10] Implementar `ManagementContextForm` en `mobile/src/presentation/components/applications/ManagementContextForm.tsx`; hacer pasar los estados de formulario
- [X] T123 [US10] Integrar edición y recarga en `mobile/src/app/(protected)/applications/[applicationId]/index.tsx`; completar `mobile/tests/component/applications/managementContextForm.test.tsx`

**Checkpoint**: el contexto operativo queda independiente del historial de
auditoría y de los motivos de transición.

---

## Phase 14: US-11 — Consultar uso de aplicación (P2)

**Objetivo**: mostrar la proyección remota de consumo distinguiendo disponible,
sin datos y dependencia no disponible.

**Prueba independiente**: una aplicación con consumo muestra mensajes,
servicios, IP y último uso; las otras dos variantes muestran mensajes distintos
sin inventar ceros.

### Tests — escribir y comprobar que fallan

- [X] T124 [P] [US11] Escribir contract tests de `UsageResponse` y los tres valores de availability en `mobile/tests/contract/applicationUsage.test.ts`; verificar fallo con `npm test -- applicationUsage.test.ts`
- [X] T125 [P] [US11] Escribir pruebas del caso de uso sin agregación local en `mobile/tests/unit/domain/getApplicationUsage.test.ts`; verificar fallo con `npm test -- getApplicationUsage.test.ts`
- [X] T126 [P] [US11] Escribir pruebas de las tres presentaciones de uso en `mobile/tests/component/applications/applicationUsage.test.tsx`; verificar fallo con `npm test -- applicationUsage.test.tsx`

### Implementación

- [X] T127 [US11] Implementar schema, mapper y `RestUsageRepository`/`FakeUsageRepository` en `mobile/src/data/schemas/usage.ts`, `mobile/src/data/mappers/usageMapper.ts` y `mobile/src/data/repositories/`; hacer pasar `mobile/tests/contract/applicationUsage.test.ts`
- [X] T128 [US11] Implementar `getApplicationUsage` en `mobile/src/domain/use-cases/usage/getApplicationUsage.ts`; hacer pasar `mobile/tests/unit/domain/getApplicationUsage.test.ts`
- [X] T129 [P] [US11] Implementar `ApplicationUsageCard` en `mobile/src/presentation/components/applications/ApplicationUsageCard.tsx`; hacer pasar los estados visuales de US-11
- [X] T130 [US11] Integrar el controlador y la sección de uso en `mobile/src/presentation/controllers/useApplicationUsageController.ts` y `mobile/src/app/(protected)/applications/[applicationId]/index.tsx`; completar `mobile/tests/component/applications/applicationUsage.test.tsx`

**Checkpoint**: US-11 puede fallar o no tener datos sin bloquear el detalle.

---

## Phase 15: US-12 — Consultar auditoría (P2)

**Objetivo**: permitir a auditor, administrador y senior consultar eventos
inmutables con filtros y paginación.

**Prueba independiente**: perfiles autorizados ven eventos ordenados y filtran
por fecha, institución, aplicación y usuario; analista recibe 403/ocultación;
sin coincidencias aparece vacío.

### Tests — escribir y comprobar que fallan

- [X] T131 [P] [US12] Escribir contract tests de `AuditPage` y filtros de `listAuditEvents` en `mobile/tests/contract/auditList.test.ts`; verificar fallo con `npm test -- auditList.test.ts`
- [X] T132 [P] [US12] Escribir pruebas de filtros, orden y paginación en `mobile/tests/unit/domain/listAuditEvents.test.ts`; verificar fallo con `npm test -- listAuditEvents.test.ts`
- [X] T133 [P] [US12] Escribir pruebas de autorización local/remota de consulta en `mobile/tests/integration/audit/auditAuthorization.test.ts`; verificar fallo con `npm test -- auditAuthorization.test.ts`
- [X] T134 [P] [US12] Escribir pruebas de lista, filtros y vacío en `mobile/tests/component/audit/auditScreen.test.tsx`; verificar fallo con `npm test -- auditScreen.test.tsx`

### Implementación

- [X] T135 [US12] Implementar schema, mapper y repositorios de consulta de auditoría en `mobile/src/data/schemas/audit.ts`, `mobile/src/data/mappers/auditMapper.ts`, `mobile/src/data/repositories/RestAuditRepository.ts` y `mobile/src/data/fake/FakeAuditRepository.ts`; hacer pasar `mobile/tests/contract/auditList.test.ts`
- [X] T136 [US12] Implementar `listAuditEvents` en `mobile/src/domain/use-cases/audit/listAuditEvents.ts`; hacer pasar `mobile/tests/unit/domain/listAuditEvents.test.ts`
- [X] T137 [P] [US12] Implementar `AuditEventCard` y `AuditFilters` en `mobile/src/presentation/components/audit/`; hacer pasar las aserciones visuales de US-12
- [X] T138 [US12] Implementar `useAuditController` y `mobile/src/app/(protected)/audit/index.tsx`; completar `mobile/tests/integration/audit/auditAuthorization.test.ts` y `mobile/tests/component/audit/auditScreen.test.tsx`

**Checkpoint**: la auditoría registrada desde P1 ya es explotable por los tres
perfiles autorizados.

---

## Phase 16: US-14 — Gestionar usuarios y perfiles (P3)

**Objetivo**: listar, crear, cambiar perfil y habilitar/deshabilitar usuarios
sin duplicar identidades y auditando cada cambio.

**Prueba independiente**: administrador crea y modifica; duplicado se rechaza;
otros perfiles no ven la sección; deshabilitar afecta la siguiente validación de
sesión.

### Tests — escribir y comprobar que fallan

- [X] T139 [P] [US14] Escribir contract tests de `UserPage`, `CreateUserRequest` y `UpdateUserRequest` en `mobile/tests/contract/users.test.ts`; verificar fallo con `npm test -- users.test.ts`
- [X] T140 [P] [US14] Escribir pruebas de listar, crear, duplicado, perfil y habilitación en `mobile/tests/unit/domain/userAdministration.test.ts`; verificar fallo con `npm test -- userAdministration.test.ts`
- [X] T141 [P] [US14] Escribir pruebas de autorización administrativa y auditoría en `mobile/tests/integration/users/userAdministrationAuthorization.test.ts`; verificar fallo con `npm test -- userAdministrationAuthorization.test.ts`
- [X] T142 [P] [US14] Escribir pruebas de lista, formulario y errores en `mobile/tests/component/users/userAdministrationScreen.test.tsx`; verificar fallo con `npm test -- userAdministrationScreen.test.tsx`

### Implementación

- [X] T143 [US14] Implementar schemas, mapper y `RestUserRepository`/`FakeUserRepository` en `mobile/src/data/schemas/users.ts`, `mobile/src/data/mappers/userMapper.ts` y `mobile/src/data/repositories/`; hacer pasar `mobile/tests/contract/users.test.ts`
- [X] T144 [US14] Implementar `listUsers`, `createUser` y `updateUser` en `mobile/src/domain/use-cases/users/`; hacer pasar `mobile/tests/unit/domain/userAdministration.test.ts`
- [X] T145 [P] [US14] Implementar `UserCard` y `UserForm` en `mobile/src/presentation/components/users/`; hacer pasar los estados de componente de US-14
- [X] T146 [US14] Implementar `useUsersController` en `mobile/src/presentation/controllers/useUsersController.ts`; hacer pasar `mobile/tests/integration/users/userAdministrationAuthorization.test.ts`
- [X] T147 [US14] Implementar `mobile/src/app/(protected)/users/index.tsx` y `mobile/src/app/(protected)/users/[userId].tsx`; completar `mobile/tests/component/users/userAdministrationScreen.test.tsx`

**Checkpoint**: todas las historias P1, P2 y P3 están implementadas y testeables.

---

## Phase 17: Polish y validación transversal

**Objetivo**: validar el candidato completo sin añadir funcionalidad nueva ni
gates ajenos a la constitución.

- [X] T148 [P] Añadir una regresión transversal contra secretos en rutas, logs, snapshots, fixtures y storage en `mobile/tests/security/noSensitivePersistence.test.ts`; verificar con `npm test -- noSensitivePersistence.test.ts`
- [X] T149 [P] Añadir pruebas de contraste, font scaling 200 %, labels, foco, 48 px y movimiento reducido en `mobile/tests/accessibility/accessibilityRegression.test.tsx`; verificar con `npm test -- accessibilityRegression.test.tsx`
- [X] T150 [P] Escribir pruebas del temporizador y correlación de rendimiento en `mobile/tests/unit/observability/operationTiming.test.ts`; verificar fallo con `npm test -- operationTiming.test.ts`
- [X] T151 Implementar medición cliente/servicio sin cuerpos sensibles en `mobile/src/data/http/OperationTiming.ts`; hacer pasar `mobile/tests/unit/observability/operationTiming.test.ts`
- [x] T152 Crear el script único `validate` en `mobile/package.json` para doctor, lint, format, typecheck, tests, contrato local y exportación web; verificar desde instalación limpia con `npm ci && npm run validate`
- [x] T153 [P] Exportar el bundle local con `npx expo export --platform web` y registrar el resultado en `mobile/docs/validation/web-export.md`
- [X] T154 [P] Validar los anchos web 360, 390 y 430 px y registrar resultados en `mobile/docs/validation/web-layout.md`
- [X] T155 Ejecutar los recorridos manuales de `quickstart.md` con el adaptador fake y registrar resultados en `mobile/docs/validation/manual.md`
- [x] T156 Implementar el runner de contrato local en `mobile/tests/contract/local/localContract.test.ts` y el script `test:contract:local`; verificar contra un stub local compatible
- [x] T157 Ejecutar `test:contract:local` y registrar los DTO, errores, idempotencia y auditoría simuladas en `mobile/docs/validation/local-contract.md`
- [X] T158 Ejecutar todos los escenarios de `specs/001-gestion-credenciales-api/quickstart.md` y consolidar versión, tests, exportación, accesibilidad y limitaciones en `mobile/docs/validation/final.md`

**Checkpoint final**: el candidato local queda construido y validado cuando T158
pasa. No constituye aprobación para un piloto ni evidencia de garantías remotas.

---

## Dependencias y orden de ejecución

### Dependencias entre fases

1. **Setup (Phase 1)** no tiene dependencias.
2. **Foundational (Phase 2)** depende de Setup y bloquea todas las historias.
3. **US-01** depende de Foundational.
4. **US-13** depende de US-01 porque el ambiente pertenece a una sesión
   protegida.
5. **US-02** depende de US-13 para consultar siempre un ambiente explícito.
6. **US-03** depende de US-02 para navegar desde el inventario.
7. **US-04** depende de US-03 para validar contexto antes de emitir.
8. **US-05** depende de US-04 para reutilizar operación y entrega.
9. **US-06** depende de US-03 y de la infraestructura de operación de US-04;
   puede desarrollarse en paralelo con US-05.
10. **US-07** depende de US-03 y de la infraestructura de operación de US-04;
    puede desarrollarse en paralelo con US-05/US-06.
11. **US-08** depende de cerrar US-01 a US-07 y US-13 para verificar toda la
    matriz P1.
12. **US-09** depende de US-04; **US-10** y **US-11** dependen de US-03; pueden
    ejecutarse en paralelo después del MVP P1.
13. **US-12** depende de US-08 porque consulta evidencia ya registrada.
14. **US-14** depende de US-01 y US-08; se mantiene después de P2 por prioridad.
15. **Polish** depende de todas las historias incluidas en el candidato.

### Grafo resumido

```text
Setup → Foundational → US-01 → US-13 → US-02 → US-03 → US-04
                                                   ├─→ US-05 ─┐
                                                   ├─→ US-06 ─┼─→ US-08 → US-12
                                                   └─→ US-07 ─┘
                                                   ├─→ US-09
                                                   ├─→ US-10
                                                   └─→ US-11
US-01 + US-08 ─────────────────────────────────────────────→ US-14
Todas las historias ───────────────────────────────────────→ Polish
```

### Orden interno de cada historia

1. Escribir todos sus tests marcados al inicio y observar el fallo esperado.
2. Implementar schemas/mappers/repositorios si existen endpoints asociados.
3. Implementar casos de uso y políticas de dominio.
4. Implementar controladores y componentes.
5. Integrar la ruta y ejecutar la prueba independiente completa.

## Oportunidades de paralelismo por historia

| Historia | Tareas que pueden prepararse en paralelo                   |
| -------- | ---------------------------------------------------------- |
| US-01    | T037–T040; después T041 y T042 en archivos distintos.      |
| US-13    | T045–T048; después T050 y T051.                            |
| US-02    | T053–T055; T058 puede avanzar tras estabilizar los tipos.  |
| US-03    | T060–T063; T066 puede avanzar tras estabilizar el detalle. |
| US-04    | T068–T072; T076 puede avanzar tras fijar el receipt.       |
| US-05    | T078–T081.                                                 |
| US-06    | T086–T089; después T091 y T092.                            |
| US-07    | T095–T098.                                                 |
| US-08    | T103 y T104.                                               |
| US-09    | T109–T112.                                                 |
| US-10    | T117–T119; T122 tras fijar el schema.                      |
| US-11    | T124–T126; T129 tras fijar el modelo.                      |
| US-12    | T131–T134; T137 tras fijar el modelo.                      |
| US-14    | T139–T142; T145 tras fijar el modelo.                      |

## Ejemplo de ejecución paralela

```text
# US-06, una vez completada su tarea de contrato T090:
Task T091: implementar suspensión y hacer pasar suspendCredential.test.ts
Task T092: implementar reactivación y hacer pasar reactivateCredential.test.ts

# P2, después del MVP P1:
Línea A: US-09 nueva entrega
Línea B: US-10 contexto de gestión
Línea C: US-11 consulta de uso
```

## Estrategia de implementación

### Primer corte demostrable

1. Completar Setup y Foundational.
2. Completar US-01, US-13, US-02 y US-03.
3. Completar US-04.
4. Detenerse y validar acceso → ambiente → inventario → detalle → emisión.

Este corte demuestra la arquitectura y la propuesta central, pero no cumple aún
todo el alcance P1 de la especificación.

### MVP funcional P1

1. Partir del corte demostrable.
2. Completar US-05, US-06 y US-07.
3. Completar US-08 y ejecutar T108.
4. Detenerse y validar el MVP P1 completo antes de iniciar P2.

### Entrega incremental

1. Añadir US-09, US-10 y US-11 en paralelo cuando haya capacidad.
2. Añadir US-12 tras cerrar la auditoría P1.
3. Añadir US-14 únicamente para la fase P3.
4. Ejecutar Polish y la validación local antes de cerrar el candidato.

## Resumen de tareas

| Alcance      |  Tareas |
| ------------ | ------: |
| Setup        |      10 |
| Foundational |      26 |
| US-01        |       8 |
| US-13        |       8 |
| US-02        |       7 |
| US-03        |       8 |
| US-04        |      10 |
| US-05        |       8 |
| US-06        |       9 |
| US-07        |       8 |
| US-08        |       6 |
| US-09        |       8 |
| US-10        |       7 |
| US-11        |       7 |
| US-12        |       8 |
| US-14        |       9 |
| Polish       |      11 |
| **Total**    | **158** |

## Notas

- Cada tarea tiene un único resultado coherente y un comando o escenario de
  verificación; si excede una sesión debe dividirse antes de implementarla.
- `[P]` no elimina dependencias de fase: solo autoriza paralelismo cuando sus
  prerrequisitos ya están completos.
- No se introducen Redux, base de datos local, cola offline, librería UI, BFF ni
  código nativo personalizado.
- Los commits deben contener una tarea o un grupo inseparable y seguir
  Conventional Commits; nunca incluir cambios ajenos.
- Esta variante no requiere acceso remoto; la validación contra un servicio real
  queda explícitamente fuera de sus criterios de cierre.

## Phase 18: Convergence

- [X] T159 Corregir la cabecera responsive del detalle para reservar una franja propia a la decoración y añadir una regresión proporcional en `mobile/tests/component/applications/applicationDetailScreen.test.tsx` y `mobile/src/app/(protected)/applications/[applicationId]/index.tsx` per FR-005/T154 (partial); verificar con `npm test -- applicationDetailScreen.test.tsx --runInBand`
- [X] T160 Ampliar el seed fake determinista a 24 aplicaciones equilibradas entre ambientes y con los cinco estados, reforzar `mobile/tests/unit/data/fakeSeed.test.ts` y documentar ubicación y ciclo de vida en `specs/001-gestion-credenciales-api/quickstart.md` per plan: fake sintético/T021/T036 (partial); verificar con `npm test -- fakeSeed.test.ts --runInBand` y `npm run typecheck`

## Phase 19: Convergence

- [X] T161 Implementar un control reutilizable de valor copiable con icono de doble rectángulo y probar que los botones copian exactamente el Client ID y el enlace seguro en `mobile/src/presentation/components/CopyableValue.tsx`, `mobile/src/app/(protected)/applications/[applicationId]/index.tsx`, `mobile/src/app/(protected)/applications/[applicationId]/operation.tsx` y sus pruebas de componente per T062/T071/T112 y `design/DESIGN.md` (partial); verificar con `npm test -- copyableValue.test.tsx --runInBand` y `npm run typecheck`
