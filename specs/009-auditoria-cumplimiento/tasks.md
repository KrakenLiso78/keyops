# Tasks: Auditoría de cumplimiento y retención

**Input**: Design documents from `/specs/009-auditoria-cumplimiento/`

**Tests**: Obligatorios. Integridad, retención y recuperación requieren evidencia del proveedor; los mocks solo validan el adapter.

## Phase 1: Setup

- [x] T001 Crear estructura compliance y fixtures versionados en `worker/src/compliance/` y `worker/tests/fixtures/compliance/`
- [x] T002 [P] Añadir bindings sin secretos y modo v2 en `worker/src/config/env.ts` y `worker/.dev.vars.example`
- [x] T003 [P] Documentar proveedor/WORM/retención/recovery en `worker/docs/compliance-audit-checkpoint.md`
- [x] T004 [P] Crear router `/v2/audit-events` en `worker/src/routes/v2/audit.ts`

## Phase 2: Foundational

- [x] T005 [P] Definir `ComplianceAuditPort` y receipts en `worker/src/compliance/ComplianceAuditPort.ts`
- [x] T006 [P] Definir evento canónico/versionado con Zod en `worker/src/compliance/eventEnvelope.ts`
- [x] T007 [P] Implementar allowlist/redacción previa en `worker/src/compliance/redactComplianceEvent.ts`
- [x] T008 [P] Implementar ID/fingerprint/idempotencia en `worker/src/compliance/integrity.ts`
- [x] T009 Crear stub WORM con append/query/verify/recovery en `worker/tests/support/ComplianceAuditStub.ts`
- [x] T010 Implementar adapter HTTP neutral en `worker/src/compliance/ComplianceAuditHttpAdapter.ts`
- [x] T011 Implementar upcasters y registro de schemas en `worker/src/compliance/schemaRegistry.ts`
- [x] T012 Implementar composición de sink funcional/compliance por modo en `worker/src/composition/createWorkerDependencies.ts`

**Checkpoint**: Eventos v2 pueden añadirse/consultarse/verificarse con stub sin usar Airtable como evidencia.

## Phase 3: US-COMP-01 — Evidencia resistente a modificaciones (P1)

**Goal**: Append WORM, rechazo de alteración y evento del intento.

**Independent Test**: Roles operativos/administrativos intentan update/delete y el original permanece íntegro.

### Tests

- [x] T013 [P] [US-COMP-01] Escribir tests fallidos de evento/allowlist/redacción en `worker/tests/unit/complianceEvent.test.ts`
- [x] T014 [P] [US-COMP-01] Escribir tests fallidos de idempotencia/conflicto/acuse perdido en `worker/tests/unit/complianceAppend.test.ts`
- [x] T015 [P] [US-COMP-01] Escribir contrato fallido de consulta/integridad y ausencia de mutaciones en `worker/tests/contract/compliance-audit-v2.contract.test.ts`
- [x] T016 [P] [US-COMP-01] Escribir test de manipulación contra stub en `worker/tests/security/compliance-tamper.test.ts`
- [x] T017 [P] [US-COMP-01] Escribir test de cero secretos/PII innecesaria en `worker/tests/security/compliance-redaction.test.ts`

### Implementation

- [x] T018 [US-COMP-01] Implementar append idempotente y acuse en `worker/src/compliance/appendComplianceEvent.ts`
- [x] T019 [US-COMP-01] Implementar reconciliación tras acuse incierto en `worker/src/audit/reconcileAudit.ts`
- [x] T020 [US-COMP-01] Conectar `AuditRecorder` al sink compliance en `worker/src/audit/AuditRecorder.ts`
- [x] T021 [US-COMP-01] Integrar resultados de catálogo/usuarios/credenciales reales en `worker/src/http/completeOperation.ts`
- [x] T022 [US-COMP-01] Exponer consulta/integridad v2 sin update/delete en `worker/src/routes/v2/audit.ts`
- [x] T023 [US-COMP-01] Registrar intento de alteración como nuevo evento en `worker/src/compliance/appendComplianceEvent.ts`

**Checkpoint**: WORM y tamper behavior demostrados con stub; evidencia real requiere Phase 5.

## Phase 4: US-COMP-02 — Recuperar eventos durante cinco años (P1)

**Goal**: Consulta legible/versionada y recovery verificable dentro de retención.

**Independent Test**: Muestra de antigüedades/versiones y recovery conserva integridad/orden/relaciones.

### Tests

- [x] T024 [P] [US-COMP-02] Escribir tests fallidos de upcasters/fixtures históricos en `worker/tests/unit/complianceSchemaRegistry.test.ts`
- [x] T025 [P] [US-COMP-02] Escribir tests fallidos de orden/filtros/cursor en `worker/tests/unit/complianceQuery.test.ts`
- [x] T026 [P] [US-COMP-02] Escribir recovery drill fallido con conteo/orden/integridad en `worker/tests/recovery/complianceRecovery.test.ts`
- [x] T027 [P] [US-COMP-02] Escribir tests móviles fallidos de integrity/empty/error en `mobile/tests/component/audit/complianceAudit.test.tsx`

### Implementation

- [x] T028 [US-COMP-02] Implementar query/version upcasting en `worker/src/compliance/queryComplianceEvents.ts`
- [x] T029 [US-COMP-02] Implementar verificación de integridad en `worker/src/compliance/verifyComplianceEvent.ts`
- [x] T030 [US-COMP-02] Implementar runner de recovery evidence en `worker/src/compliance/runRecoveryProbe.ts`
- [x] T031 [US-COMP-02] Completar rutas v2 de consulta/verificación en `worker/src/routes/v2/audit.ts`
- [x] T032 [P] [US-COMP-02] Añadir integridad/retención al dominio/DTO móvil en `mobile/src/domain/model/audit.ts` y `mobile/src/data/schemas/audit.ts`
- [x] T033 [US-COMP-02] Adaptar `RestAuditRepository` a v2 en `mobile/src/data/repositories/RestAuditRepository.ts`
- [x] T034 [US-COMP-02] Mostrar estado de integridad y filtros en `mobile/src/presentation/components/audit/index.tsx`

**Checkpoint**: Consulta/recovery completos con fixtures; no prueban retención corporativa.

## Phase 5: Compliance validation

- [ ] T035 [P] Ejecutar suites y documentar evidencia local en `specs/009-auditoria-cumplimiento/quickstart.md`
- [ ] T036 Registrar excepción constitucional/owner/caducidad en `worker/docs/compliance-audit-checkpoint.md`
- [ ] T037 Obtener aprobación de proveedor, WORM, cinco años, roles, backup y runbook en `worker/docs/compliance-audit-checkpoint.md`
- [ ] T038 Implementar adapter concreto tras T037 en `worker/src/compliance/CorporateComplianceAuditAdapter.ts`
- [ ] T039 Ejecutar append y ataques update/delete con roles autorizados en `worker/tests/integration/compliance-tamper.pilot.test.ts`
- [ ] T040 Verificar muestra versionada/retention lock en `worker/tests/integration/compliance-retention.pilot.test.ts`
- [ ] T041 Ejecutar recovery drill y comparar conteo/orden/integridad en `worker/tests/recovery/complianceRecovery.pilot.test.ts`
- [ ] T042 Ejecutar trazabilidad E2E de 006–008 en `worker/tests/integration/pilot-audit-e2e.test.ts`
- [ ] T043 Documentar evidencia y limitaciones en `specs/009-auditoria-cumplimiento/quickstart.md`

## Dependencies & Execution Order

- Foundation puede avanzar tras 005; integración completa T021/T042 requiere 006–008.
- T001–T012 bloquean historias; US-COMP-01 precede consulta/recovery final.
- T037 es checkpoint externo y bloquea T038–T043.
- Airtable nunca sustituye evidencia WORM en estos checkpoints.

## Parallel Opportunities

- T002–T009 y los bloques de tests marcados [P] trabajan en ficheros distintos.
- T039/T040 preparan escenarios distintos, pero el recovery T041 depende de datos confirmados.

## Incremental Strategy

1. Evento canónico, adapter y append.
2. Manipulación/idempotencia.
3. Consulta/versionado/recovery.
4. Proveedor WORM y evidencia transversal.
