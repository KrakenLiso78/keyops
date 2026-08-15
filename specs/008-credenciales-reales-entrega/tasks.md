# Tasks: Credenciales reales y entrega segura

**Input**: Design documents from `/specs/008-credenciales-reales-entrega/`

**Tests**: Obligatorios para operaciones críticas. Los tests de cada historia se escriben primero y deben fallar antes de implementar.

## Phase 1: Setup

- [ ] T001 Crear estructura de provider/entrega real y fixtures en `worker/src/credentials/real/`, `worker/src/delivery/` y `worker/tests/fixtures/real-credentials/`
- [ ] T002 [P] Añadir bindings sin secretos y modo real solo servidor en `worker/src/config/env.ts` y `worker/.dev.vars.example`
- [ ] T003 [P] Documentar servicios, scopes, sandbox y canales en `worker/docs/real-credentials-checkpoint.md`
- [ ] T004 [P] Crear router `/v2` y negociación de contrato en `worker/src/routes/v2/index.ts`

## Phase 2: Foundational

- [ ] T005 [P] Definir `CredentialProviderPort` y tipos seguros en `worker/src/credentials/real/CredentialProviderPort.ts`
- [ ] T006 [P] Definir `SecureDeliveryPort` sin material persistible en `worker/src/delivery/SecureDeliveryPort.ts`
- [ ] T007 [P] Implementar schemas Zod de provider/receipt en `worker/src/credentials/real/realCredentialSchemas.ts`
- [ ] T008 [P] Crear stubs configurables de provider/entrega en `worker/tests/support/RealCredentialProviderStub.ts` y `worker/tests/support/SecureDeliveryStub.ts`
- [ ] T009 Implementar adapters HTTP neutrales en `worker/src/credentials/real/CredentialProviderHttpAdapter.ts` y `worker/src/delivery/SecureDeliveryHttpAdapter.ts`
- [ ] T010 Definir los deltas `RealCredentialReferences`/`RealOperationReceipts` en `worker/scripts/airtable/README.md` e implementar su repositorio en `worker/src/airtable/RealCredentialReferenceRepository.ts`
- [ ] T011 [P] Implementar idempotencia/fingerprint v2 en `worker/src/credentials/real/realIdempotency.ts`
- [ ] T012 Implementar orquestador y reconciliación por operation ID en `worker/src/credentials/real/realOperationService.ts`
- [ ] T013 [P] Implementar redacción de responses/logs externos en `worker/src/credentials/real/redactRealCredential.ts`
- [ ] T014 Conectar providers por composición servidor/ambiente en `worker/src/composition/createWorkerDependencies.ts`

**Checkpoint**: Providers neutrales, metadata y reconciliación probables sin secretos reales.

## Phase 3: US-REAL-01 — Emitir y rotar credenciales reales (P1)

**Goal**: Emisión/rotación efectiva, una versión activa e idempotencia ante fallos.

**Independent Test**: Emitir, rotar, perder respuesta, fallar por paso y probar aceptación efectiva.

### Tests

- [ ] T015 [P] [US-REAL-01] Escribir tests fallidos de emisión/rotación/invariantes en `worker/tests/unit/realIssueRotate.test.ts`
- [ ] T016 [P] [US-REAL-01] Escribir tests fallidos de idempotencia/reconciliación en `worker/tests/unit/realOperationService.test.ts`
- [ ] T017 [P] [US-REAL-01] Escribir contrato fallido de rutas v2 y receipts en `worker/tests/contract/real-credential-v2.contract.test.ts`
- [ ] T018 [P] [US-REAL-01] Escribir tests de fallos antes/después de provider/metadata/audit en `worker/tests/integration/real-credential-failures.test.ts`
- [ ] T019 [P] [US-REAL-01] Escribir test móvil fallido sin éxito optimista/reintento en `mobile/tests/component/credentials/realIssueRotate.test.tsx`
- [ ] T020 [P] [US-REAL-01] Escribir test de cero secretos en DTO/log/metadata en `worker/tests/security/real-credential-redaction.test.ts`

### Implementation

- [ ] T021 [US-REAL-01] Implementar emisión y status probe en `worker/src/credentials/real/issueRealCredential.ts`
- [ ] T022 [US-REAL-01] Implementar rotación/reconciliación sin coexistencia en `worker/src/credentials/real/rotateRealCredential.ts`
- [ ] T023 [US-REAL-01] Exponer issue/rotate/status v2 en `worker/src/routes/v2/credentials.ts`
- [ ] T024 [US-REAL-01] Persistir solo referencia/receipt confirmado en `worker/src/airtable/RealCredentialReferenceRepository.ts`
- [ ] T025 [US-REAL-01] Adaptar repositorio móvil a v2 en `mobile/src/data/repositories/RestCredentialRepository.ts`
- [ ] T026 [US-REAL-01] Conectar confirmación/reintento/reconciliación en `mobile/src/presentation/controllers/useCredentialOperationController.ts`

**Checkpoint**: Emisión/rotación completas con stubs; evidencia real requiere Phase 6.

## Phase 4: US-REAL-02 — Suspender, reactivar y revocar (P1)

**Goal**: Transiciones efectivas y comprobadas por el proveedor real.

**Independent Test**: Aceptación antes/después de cada transición, revocación terminal y perfil no autorizado.

### Tests

- [ ] T027 [P] [US-REAL-02] Escribir tests fallidos de transiciones/permisos/terminalidad en `worker/tests/unit/realTransitions.test.ts`
- [ ] T028 [P] [US-REAL-02] Escribir contrato fallido de transición v2 en `worker/tests/contract/real-transition-v2.contract.test.ts`
- [ ] T029 [P] [US-REAL-02] Escribir test móvil fallido de motivo/confirmación/acciones en `mobile/tests/component/credentials/realTransitions.test.tsx`

### Implementation

- [ ] T030 [US-REAL-02] Implementar suspensión/reactivación/revocación y probe en `worker/src/credentials/real/transitionRealCredential.ts`
- [ ] T031 [US-REAL-02] Exponer transición autorizada/idempotente en `worker/src/routes/v2/credentials.ts`
- [ ] T032 [US-REAL-02] Completar métodos v2 en `mobile/src/data/repositories/RestCredentialRepository.ts`
- [ ] T033 [US-REAL-02] Actualizar UI y último estado confirmado en `mobile/src/presentation/components/credentials/index.tsx`

**Checkpoint**: Estado terminal y aceptación efectivos con stub; provider real pendiente.

## Phase 5: US-REAL-03 — Entregar secretos de forma protegida (P1)

**Goal**: ZIP cifrado, contraseña/OTP separados y OTP de un uso/dos minutos.

**Independent Test**: Entrega válida, expiración, reutilización, canales distintos y ausencia de secretos persistentes.

### Tests

- [ ] T034 [P] [US-REAL-03] Escribir tests fallidos de contrato de entrega/canales en `worker/tests/unit/secureDelivery.test.ts`
- [ ] T035 [P] [US-REAL-03] Escribir contrato v2 fallido sin secretos en receipt en `worker/tests/contract/secure-delivery-v2.contract.test.ts`
- [ ] T036 [P] [US-REAL-03] Escribir test E2E stub de OTP usado/caducado/distinto en `worker/tests/integration/secure-delivery-flow.test.ts`
- [ ] T037 [P] [US-REAL-03] Escribir test móvil fallido de memoria/limpieza/background en `mobile/tests/component/credentials/realDelivery.test.tsx`

### Implementation

- [ ] T038 [US-REAL-03] Implementar preparación de entrega por handle sellado en `worker/src/delivery/prepareSecureDelivery.ts`
- [ ] T039 [US-REAL-03] Integrar entrega en emisión/rotación sin persistir material en `worker/src/credentials/real/realOperationService.ts`
- [ ] T040 [US-REAL-03] Exponer solo referencias/expiración en `worker/src/routes/v2/credentials.ts`
- [ ] T041 [US-REAL-03] Limpiar material transitorio y estado visual en `mobile/src/presentation/controllers/useCredentialOperationController.ts`
- [ ] T042 [US-REAL-03] Etiquetar operación real/canales y errores en `mobile/src/presentation/components/credentials/index.tsx`

**Checkpoint**: Flujo seguro demostrado con stub; aceptación real exige canales corporativos T049–T052.

## Phase 6: Corporate validation

- [ ] T043 [P] Ejecutar suite completa y documentar evidencia local en `specs/008-credenciales-reales-entrega/quickstart.md`
- [ ] T044 [P] Ejecutar integración Airtable de referencias entre procesos en `worker/tests/integration/airtable-real-references.test.ts`
- [ ] T045 [P] Escanear bundle/responses/logs/records por secretos en `worker/tests/security/real-credential-redaction.test.ts`
- [ ] T046 Registrar excepción constitucional/owner/caducidad en `worker/docs/real-credentials-checkpoint.md`
- [ ] T047 Obtener contratos, owners, sandbox, scopes y semántica de estado en `worker/docs/real-credentials-checkpoint.md`
- [ ] T048 Implementar adapters concretos tras T047 en `worker/src/credentials/real/CorporateCredentialProviderAdapter.ts` y `worker/src/delivery/CorporateSecureDeliveryAdapter.ts`
- [ ] T049 Ejecutar issue/rotate y comprobar una activa en `worker/tests/integration/real-credentials.pilot.test.ts`
- [ ] T050 Ejecutar suspend/reactivate/revoke y acceptance probes en `worker/tests/integration/real-credentials.pilot.test.ts`
- [ ] T051 Ejecutar OTP/canales/expiración contra entrega real en `worker/tests/integration/secure-delivery.pilot.test.ts`
- [ ] T052 Documentar evidencia, límites y cero secretos en `specs/008-credenciales-reales-entrega/quickstart.md`

## Dependencies & Execution Order

- Requiere catálogo 006 validado, identidad 007 validada y auditabilidad 005; 009 completa cumplimiento.
- T001–T014 bloquean historias; US-REAL-01 precede transiciones/entrega.
- T047 es checkpoint externo y bloquea T048–T052.
- La feature no se declara piloto-ready hasta completar 009 sobre sus operaciones.

## Parallel Opportunities

- T002–T008/T011/T013 y los bloques de tests [P] son paralelos.
- Tests de metadata/redacción T044/T045 pueden ejecutarse juntos.

## Incremental Strategy

1. Providers neutrales e idempotencia.
2. Emisión/rotación.
3. Transiciones.
4. Entrega segura.
5. Adapters reales y E2E.
