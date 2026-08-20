# Tasks: Ciclo de vida de credenciales sintéticas

**Input**: Design documents from `/specs/004-ciclo-credenciales-sinteticas/`

**Tests**: Obligatorios por criticidad. Cada bloque de tests se escribe primero y debe fallar por la capacidad todavía ausente.

## Phase 1: Setup

- [x] T001 Añadir `Credentials`, `CredentialVersions`, `DeliveryGrants` e `IdempotencyRecords` a `worker/scripts/airtable/schema.md`
- [x] T002 Crear fixtures por estado y ambiente en `worker/scripts/airtable/fixtures/credentials.json`
- [x] T003 Extender el seed idempotente con credenciales sintéticas en `worker/scripts/airtable/seed-credentials.ts` usando lotes de diez
- [x] T004 [P] Añadir `DELIVERY_PEPPER` al ejemplo y validación de secretos en `worker/.dev.vars.example` y `worker/src/config/env.ts`

**Checkpoint**: Fixtures sintéticos disponibles sin Client Secret, OTP persistido ni efecto externo.

## Phase 2: Foundational

- [x] T005 [P] Definir schemas Airtable para credencial/versión en `worker/src/airtable/credentialSchema.ts`
- [x] T006 [P] Definir schemas de idempotencia/entrega en `worker/src/airtable/operationSchema.ts`
- [x] T007 [P] Implementar máquina de estados pura y permisos por acción en `worker/src/credentials/stateMachine.ts`
- [x] T008 [P] Implementar generador sintético y digest HMAC en `worker/src/credentials/syntheticDelivery.ts`
- [x] T009 Implementar persistencia/reconciliación de credenciales en `worker/src/airtable/CredentialRepository.ts`
- [x] T010 [P] Implementar reservas y receipts idempotentes en `worker/src/airtable/IdempotencyRepository.ts`
- [x] T011 [P] Implementar creación/invalidez/consumo de grants en `worker/src/airtable/DeliveryGrantRepository.ts`
- [x] T012 Implementar orquestador `processing/committed/failed` en `worker/src/credentials/operationService.ts`
- [x] T013 [P] Crear fixtures y dobles de fallo por paso en `worker/tests/fixtures/credentials.ts` y `worker/tests/support/FailingCredentialStore.ts`
- [x] T014 [P] Completar tipos/schemas y puerto de consumo de artefacto sin secretos persistibles en `mobile/src/domain/ports/CredentialRepository.ts` y `mobile/src/data/schemas/credentialOperation.ts`

**Checkpoint**: Reglas puras y repositorios pueden probar fallos intermedios antes de exponer rutas.

## Phase 3: US-CRED-01 — Emitir una credencial sintética (P1)

**Goal**: Primera versión activa y entrega sintética, sin segunda emisión activa.

**Independent Test**: Aplicación sin credencial, aplicación ya activa, permiso ausente y relectura persistente.

### Tests

- [x] T015 [P] [US-CRED-01] Escribir tests fallidos de transición inicial/permisos en `worker/tests/unit/credential-issue.test.ts`
- [x] T016 [P] [US-CRED-01] Escribir contrato fallido de emisión e `Idempotency-Key` en `worker/tests/contract/credential-issue.contract.test.ts`
- [x] T017 [P] [US-CRED-01] Escribir test móvil fallido de confirmación/errores/no optimismo en `mobile/tests/component/credential-issue.test.tsx`
- [x] T018 [P] [US-CRED-01] Escribir test de seguridad fallido para artefacto/receipt/logs en `worker/tests/security/synthetic-material.test.ts`

### Implementation

- [x] T019 [US-CRED-01] Implementar emisión inicial e invariantes en `worker/src/credentials/issueCredential.ts`
- [x] T020 [US-CRED-01] Exponer `POST /v1/applications/{id}/credentials` en `worker/src/routes/v1/credentials.ts`
- [x] T021 [P] [US-CRED-01] Implementar mapper de receipt/entrega en `mobile/src/data/mappers/credentialOperationMapper.ts`
- [x] T022 [US-CRED-01] Sustituir alias por `RestCredentialRepository.issue()` real en `mobile/src/data/repositories/RestCredentialRepository.ts`
- [x] T023 [US-CRED-01] Conectar emisión, clave retenida y relectura confirmada en `mobile/src/presentation/controllers/useCredentialOperationController.ts`
- [x] T024 [US-CRED-01] Mostrar etiqueta sintética y estados pending/error/confirmed en `mobile/src/presentation/components/credentials/index.tsx`

**Checkpoint**: Emisión testeable independientemente y persistente; auditoría completa se conecta en feature 005.

## Phase 4: US-CRED-02 — Regenerar una credencial sintética (P1)

**Goal**: Rotar con una sola versión activa y recuperación tras respuesta incierta.

**Independent Test**: Rotación válida, ausencia de versión, fallo entre pasos y reintento desde cliente nuevo.

### Tests

- [x] T025 [P] [US-CRED-02] Escribir tests fallidos de rotación/reconciliación en `worker/tests/unit/credential-regeneration.test.ts`
- [x] T026 [P] [US-CRED-02] Escribir contrato fallido de regeneración y conflicto de huella en `worker/tests/contract/credential-regeneration.contract.test.ts`
- [x] T027 [P] [US-CRED-02] Escribir test móvil fallido de confirmación y reintento seguro en `mobile/tests/component/credential-regeneration.test.tsx`

### Implementation

- [x] T028 [US-CRED-02] Implementar creación pending, cambio agrupado y reconciliación en `worker/src/credentials/regenerateCredential.ts`
- [x] T029 [US-CRED-02] Añadir ruta de regeneración al router en `worker/src/routes/v1/credentials.ts`
- [x] T030 [US-CRED-02] Implementar `regenerate()` preservando clave idempotente en `mobile/src/data/repositories/RestCredentialRepository.ts`
- [x] T031 [US-CRED-02] Añadir confirmación/reintento y último estado confirmado en `mobile/src/presentation/controllers/useCredentialOperationController.ts`

**Checkpoint**: Los fallos simulados dejan cero o una versión activa, nunca dos; un reintento recupera el receipt.

## Phase 5: US-CRED-03 — Suspender y reactivar (P1)

**Goal**: Transiciones reversibles con motivo, permiso y persistencia.

**Independent Test**: active→suspended→active y rechazo desde revoked.

### Tests

- [x] T032 [P] [US-CRED-03] Escribir tests fallidos de estado/motivo/permisos en `worker/tests/unit/credential-suspension.test.ts`
- [x] T033 [P] [US-CRED-03] Escribir test de componente fallido de formularios y errores en `mobile/tests/component/credential-suspension.test.tsx`

### Implementation

- [x] T034 [US-CRED-03] Implementar suspensión/reactivación en `worker/src/credentials/transitionCredential.ts`
- [x] T035 [US-CRED-03] Exponer acciones validadas en `worker/src/routes/v1/credentials.ts`
- [x] T036 [US-CRED-03] Implementar `suspend()`/`reactivate()` REST en `mobile/src/data/repositories/RestCredentialRepository.ts`
- [x] T037 [US-CRED-03] Conectar motivo, confirmación y acciones visibles en `mobile/src/presentation/components/credentials/index.tsx`

**Checkpoint**: La historia se ejecuta desde fixtures active/suspended sin depender de revocación UI.

## Phase 6: US-CRED-04 — Revocar definitivamente (P1)

**Goal**: Estado terminal permitido solo al perfil correspondiente.

**Independent Test**: Revocar active/suspended, repetir, intentar reactivar/entregar y usar un perfil no autorizado.

### Tests

- [x] T038 [P] [US-CRED-04] Escribir tests fallidos de terminalidad y perfil en `worker/tests/unit/credential-revocation.test.ts`
- [x] T039 [P] [US-CRED-04] Escribir contrato fallido de 403/409/reintento en `worker/tests/contract/credential-revocation.contract.test.ts`
- [x] T040 [P] [US-CRED-04] Escribir test móvil fallido de doble confirmación y acciones posteriores ocultas en `mobile/tests/component/credential-revocation.test.tsx`

### Implementation

- [x] T041 [US-CRED-04] Completar revocación terminal e invalidación de grants en `worker/src/credentials/transitionCredential.ts`
- [x] T042 [US-CRED-04] Implementar `revoke()` REST en `mobile/src/data/repositories/RestCredentialRepository.ts`
- [x] T043 [US-CRED-04] Conectar `RevokeConfirmation` y reset tras respuesta en `mobile/src/presentation/components/credentials/RevokeConfirmation.tsx`

**Checkpoint**: Ninguna ruta posterior modifica o entrega una credencial revocada.

## Phase 7: US-CRED-05 — Reentregar material sintético (P2)

**Goal**: Nueva entrega y código de dos minutos, un uso, invalidando el anterior.

**Independent Test**: Entrega vigente, código usado/caducado/anterior y credencial revocada.

### Tests

- [x] T044 [P] [US-CRED-05] Escribir tests fallidos de digest, tiempo, consumo e invalidación en `worker/tests/unit/synthetic-delivery.test.ts`
- [x] T045 [P] [US-CRED-05] Escribir contrato fallido de creación/consumo en `worker/tests/contract/synthetic-delivery.contract.test.ts`
- [x] T046 [P] [US-CRED-05] Escribir test móvil fallido de memoria/limpieza de código en `mobile/tests/component/synthetic-delivery.test.tsx`

### Implementation

- [x] T047 [US-CRED-05] Implementar nueva entrega e invalidación anterior en `worker/src/credentials/createDelivery.ts`
- [x] T048 [US-CRED-05] Implementar consumo atómico lógico y artefacto etiquetado en `worker/src/credentials/consumeDelivery.ts`
- [x] T049 [US-CRED-05] Exponer rutas de entrega/artefacto en `worker/src/routes/v1/credentials.ts`
- [x] T050 [US-CRED-05] Implementar `deliver()` y descarga explícita en `mobile/src/data/repositories/RestCredentialRepository.ts`
- [x] T051 [US-CRED-05] Mantener OTP solo en memoria y limpiarlo al cerrar/background en `mobile/src/presentation/controllers/useCredentialOperationController.ts`

**Checkpoint**: Código nuevo utilizable una vez; el anterior, usado o caducado devuelve rechazo controlado.

## Phase 8: Persistence, security and Sprint evidence

- [ ] T052 Ejecutar escenario persistente de las cinco historias desde proceso nuevo en `worker/tests/integration/airtable-credentials.test.ts`
- [x] T053 [P] Ejecutar análisis de respuestas/logs/registros por secretos en `worker/tests/security/credential-redaction.test.ts`
- [ ] T054 [P] Medir registros/llamadas y actualizar presupuesto real en `specs/004-ciclo-credenciales-sinteticas/plan.md`
- [ ] T055 Recorrer el ciclo crítico en preview móvil y registrar evidencia/limitaciones en `specs/004-ciclo-credenciales-sinteticas/quickstart.md`
- [x] T056 Conectar todos los resultados a la auditoría persistente de feature 005 antes de declarar FR-CRED-012 superado

## Dependencies & Execution Order

- Requiere sesión/autorización de 002 e inventario/aplicaciones de 003, o fixtures equivalentes para tests aislados.
- T001–T014 bloquean todas las historias.
- Emisión precede regeneración; suspensión/reactivación y revocación reutilizan la transición; entrega reutiliza versiones y grants.
- Feature 005 debe completar T056 para aceptar la trazabilidad, aunque las reglas y persistencia de credenciales se validen antes.

## Parallel Opportunities

- T005–T008/T010/T011/T013/T014 trabajan en ficheros distintos.
- Todos los grupos de tests marcados [P] pueden prepararse en paralelo por historia.
- Mappers/controladores móviles pueden avanzar una vez congelado el contrato.

## Incremental Strategy

1. Emisión + entrega inicial como primer corte demostrable.
2. Regeneración e idempotencia ante respuesta incierta.
3. Suspensión/reactivación y revocación.
4. Reentrega, persistencia completa y conexión de auditoría.
