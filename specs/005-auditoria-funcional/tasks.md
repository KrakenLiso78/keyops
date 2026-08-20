# Tasks: Auditoría funcional persistente

**Input**: Design documents from `/specs/005-auditoria-funcional/`

**Tests**: Obligatorios. La prueba persistente bajo demanda es necesaria para cerrar las historias y los criterios cruzados de 002–004.

## Phase 1: Setup

- [x] T001 Añadir `AuditEvents` y su presupuesto a `worker/scripts/airtable/schema.md`
- [x] T002 Crear fixtures de éxito/fallo/rechazo y filtros en `worker/scripts/airtable/fixtures/audit-events.json`
- [x] T003 Extender seed/limpieza por `testRunId` en `worker/scripts/airtable/seed-audit.ts` sin borrar eventos ajenos
- [x] T004 [P] Añadir comando selectivo `test:integration:airtable -- audit` en `worker/package.json`

**Checkpoint**: Tabla y fixtures disponibles con margen dentro de 1.000 registros.

## Phase 2: Foundational

- [x] T005 [P] Definir schema allowlist y nombres versionados en `worker/src/audit/auditEventSchema.ts`
- [x] T006 [P] Implementar redacción/rechazo de campos prohibidos en `worker/src/audit/redactAudit.ts`
- [x] T007 [P] Implementar contexto confiable de request ID, IP y actor en `worker/src/http/requestContext.ts`
- [x] T008 Implementar fábrica determinista de eventos en `worker/src/audit/auditEventFactory.ts`
- [x] T009 Implementar repositorio Airtable solo `append/list` en `worker/src/airtable/AuditEventRepository.ts`
- [x] T010 Implementar `AuditRecorder` y conectar el `AuditSink` de 002 en `worker/src/audit/AuditRecorder.ts`
- [x] T011 Implementar finalización síncrona de resultado y recuperación idempotente en `worker/src/http/completeOperation.ts`
- [x] T012 [P] Crear dobles de append/list/fallo y reloj en `worker/tests/support/InMemoryAuditRepository.ts`

**Checkpoint**: Un handler puede completar éxito/fallo/rechazo con un evento validado, sin exponer todavía la consulta.

## Phase 3: US-AUD-01 — Registrar acciones e intentos (P1)

**Goal**: Persistir eventos completos para los tres resultados en todos los flujos del Sprint.

**Independent Test**: Éxito, fallo y rechazo se leen desde otro proceso con actor, acción, recurso, ambiente, IP y tiempo.

### Tests

- [x] T013 [P] [US-AUD-01] Escribir tests fallidos de fábrica/redacción/empates en `worker/tests/unit/audit-event.test.ts`
- [x] T014 [P] [US-AUD-01] Escribir tests fallidos de finalización y fallo de append en `worker/tests/unit/complete-operation.test.ts`
- [x] T015 [P] [US-AUD-01] Escribir test de seguridad fallido con password/token/OTP/URL en `worker/tests/security/audit-redaction.test.ts`
- [x] T016 [US-AUD-01] Escribir integración Airtable fallida para tres resultados y proceso nuevo en `worker/tests/integration/airtable-audit-write.test.ts`

### Implementation

- [x] T017 [US-AUD-01] Integrar `completeOperation` en creación/restauración de sesión desde `worker/src/routes/v1/sessions.ts`
- [x] T018 [US-AUD-01] Integrar resultados de lista/detalle/gestión desde `worker/src/routes/v1/applications.ts`
- [x] T019 [US-AUD-01] Integrar emisión/regeneración/transiciones/entrega desde `worker/src/routes/v1/credentials.ts`
- [x] T020 [US-AUD-01] Asegurar que los rechazos de middleware también finalizan evento en `worker/src/index.ts` y `worker/src/auth/authorize.ts`
- [x] T021 [US-AUD-01] Reconciliar receipt/auditEventId al reintentar operación idempotente en `worker/src/credentials/operationService.ts`

**Checkpoint**: Se pueden cerrar FR-WEB de trazabilidad, FR-CRED-012 y los intentos de datos para el Sprint.

## Phase 4: US-AUD-02 — Consultar y filtrar el historial (P1)

**Goal**: Consulta autorizada, paginada, filtrada y ordenada sin secretos.

**Independent Test**: Tres perfiles autorizados, analista rechazado, filtros con/sin resultados y empate temporal.

### Tests

- [x] T022 [P] [US-AUD-02] Escribir tests fallidos de permisos/filtros/orden/página en `worker/tests/unit/audit-query.test.ts`
- [x] T023 [P] [US-AUD-02] Escribir contrato fallido de `GET /v1/audit-events` y ausencia de mutaciones en `worker/tests/contract/audit.contract.test.ts`
- [x] T024 [P] [US-AUD-02] Escribir tests móviles fallidos de loading/empty/error/filtros/roles en `mobile/tests/component/audit-list.test.tsx`

### Implementation

- [x] T025 [US-AUD-02] Implementar consulta/filtros/orden determinista en `worker/src/audit/listAuditEvents.ts`
- [x] T026 [US-AUD-02] Exponer solo `GET /v1/audit-events` autorizado en `worker/src/routes/v1/audit.ts` y registrar su rechazo
- [x] T027 [P] [US-AUD-02] Añadir recurso al modelo y completar schemas/mapper en `mobile/src/domain/model/audit.ts`, `mobile/src/data/schemas/audit.ts`, `mobile/src/data/schemas/auditList.ts` y `mobile/src/data/mappers/auditMapper.ts`
- [x] T028 [US-AUD-02] Sustituir alias por `RestAuditRepository.list()` real en `mobile/src/data/repositories/RestAuditRepository.ts`
- [x] T029 [US-AUD-02] Conectar filtros, estado vacío y errores en `mobile/src/presentation/controllers/useAuditController.ts`
- [x] T030 [US-AUD-02] Aplicar visibilidad por permiso y filtros conservados en `mobile/src/presentation/components/audit/index.tsx` y la ruta de auditoría

**Checkpoint**: Consulta independiente contra eventos sembrados; un analista directo recibe rechazo y genera evento.

## Phase 5: Sprint validation and honest evidence

- [ ] T031 Ejecutar integración Airtable de escritura/lectura y registrar fecha/recuento en `specs/005-auditoria-funcional/quickstart.md`
- [x] T032 [P] Ejecutar suite completa de redacción y búsqueda de secretos en `worker/tests/security/audit-redaction.test.ts`
- [x] T033 [P] Verificar por contrato que PATCH/PUT/DELETE de auditoría devuelven 404/405 en `worker/tests/contract/audit.contract.test.ts`
- [x] T034 Recorrer desde preview un acceso y una operación, consultar eventos y registrar evidencia en `specs/005-auditoria-funcional/quickstart.md`
- [x] T035 Contabilizar registros/eventos y documentar margen y política de fixtures en `specs/005-auditoria-funcional/plan.md`
- [x] T036 Revisar evidencia conjunta 002–005 y declarar explícitamente que no prueba inmutabilidad administrativa ni retención de cinco años

## Dependencies & Execution Order

- Requiere el Worker/contexto de 002. Puede crear su foundation después de 002 T014.
- Las integraciones T017–T021 requieren las rutas correspondientes de 002–004; los tests/foundation y la consulta con fixtures pueden avanzar antes.
- US-AUD-01 precede la aceptación final de US-AUD-02 porque la consulta debe registrar rechazos.
- T036 es el checkpoint final del Sprint actual: ninguna feature 002–004 se declara completamente trazable antes de él.

## Parallel Opportunities

- T005–T007 y T012 son paralelos.
- T013–T015 pueden escribirse en paralelo; T017–T019 modifican rutas distintas.
- T022–T024 y T027 pueden repartirse una vez congelado el contrato.

## Incremental Strategy

1. Fábrica, redacción y append.
2. Integrar acceso y una operación representativa.
3. Integrar el resto de rutas 002–004.
4. Añadir consulta/filtros y ejecutar evidencia persistente conjunta.
