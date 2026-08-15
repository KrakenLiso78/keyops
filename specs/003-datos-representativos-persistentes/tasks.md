# Tasks: Datos representativos persistentes

**Input**: Design documents from `/specs/003-datos-representativos-persistentes/`

**Tests**: Obligatorios; los tests de historia se escriben y fallan antes de implementar. La persistencia exige la prueba Airtable bajo demanda.

## Phase 1: Setup

- [x] T001 Crear esquema documentado de `Institutions`, `ApiRoles` y `Applications` en `worker/scripts/airtable/schema.md` conforme a `data-model.md`
- [x] T002 Crear fixtures representativos de 24 aplicaciones y dos ambientes en `worker/scripts/airtable/fixtures/applications.json`
- [x] T003 Implementar seed idempotente y batching de diez en `worker/scripts/airtable/seed-applications.ts`
- [x] T004 [P] Añadir scripts `seed:test` y `test:integration:airtable` en `worker/package.json` sin incluir secretos

**Checkpoint**: La base de test se puede sembrar repetidamente sin duplicados y respeta el presupuesto.

## Phase 2: Foundational

- [x] T005 [P] Definir schemas Airtable/REST de institución, rol y aplicación en `worker/src/airtable/applicationSchema.ts`
- [x] T006 [P] Implementar normalización Unicode y campos de búsqueda permitidos en `worker/src/applications/normalizeSearch.ts`
- [x] T007 [P] Implementar claves TTL e invalidación en `worker/src/cache/applicationCache.ts`
- [x] T008 Implementar joins y mapper allowlist en `worker/src/airtable/applicationMapper.ts`
- [x] T009 Implementar list/get/update con paginación y ambiente en `worker/src/airtable/ApplicationRepository.ts`
- [x] T010 [P] Añadir fixtures de repositorio y errores 429/503/409 en `worker/tests/fixtures/applications.ts`

**Checkpoint**: El adaptador devuelve modelos validados, separados por ambiente y sin campos secretos.

## Phase 3: US-DATA-01 — Localizar aplicaciones y credenciales (P1)

**Goal**: Inventario persistente buscable, filtrable, ordenado y paginado.

**Independent Test**: 20+ registros, coincidencias autorizadas por ambiente y estado vacío conservando criterios.

### Tests

- [x] T011 [P] [US-DATA-01] Escribir tests fallidos de normalización, ambiente, filtros, orden y páginas en `worker/tests/unit/application-query.test.ts`
- [x] T012 [P] [US-DATA-01] Escribir contrato fallido de `GET /v1/applications` y errores en `worker/tests/contract/applications-list.contract.test.ts`
- [x] T013 [P] [US-DATA-01] Escribir tests móviles fallidos de loading/empty/error/filtros en `mobile/tests/component/application-list.test.tsx`
- [x] T014 [P] [US-DATA-01] Escribir test de seguridad fallido de búsqueda sin secretos en `worker/tests/security/application-search-redaction.test.ts`

### Implementation

- [x] T015 [US-DATA-01] Implementar caso de consulta y autorización en `worker/src/applications/listApplications.ts`
- [x] T016 [US-DATA-01] Exponer `GET /v1/applications` en `worker/src/routes/v1/applications.ts` con caché por usuario/ambiente/consulta
- [x] T017 [P] [US-DATA-01] Completar schemas y mapper de lista en `mobile/src/data/schemas/applicationList.ts` y `mobile/src/data/mappers/applicationListMapper.ts`
- [x] T018 [US-DATA-01] Implementar `list()` real en `mobile/src/data/repositories/RestApplicationRepository.ts`
- [x] T019 [US-DATA-01] Conectar paginación/filtros/errores sin polling en `mobile/src/presentation/controllers/useApplicationListController.ts` y la pantalla de aplicaciones

**Checkpoint**: Inventario usable independientemente con datos Airtable o fixtures equivalentes de contrato.

## Phase 4: US-DATA-02 — Consultar detalle (P1)

**Goal**: Detalle completo autorizado sin secretos.

**Independent Test**: Registro existente, inexistente e historial representativo.

### Tests

- [x] T020 [P] [US-DATA-02] Escribir contrato fallido de detalle/404/ambiente incorrecto en `worker/tests/contract/application-detail.contract.test.ts`
- [x] T021 [P] [US-DATA-02] Escribir test móvil fallido de detalle y ausencia de Client Secret en `mobile/tests/component/application-detail.test.tsx`

### Implementation

- [x] T022 [US-DATA-02] Implementar `GET /v1/applications/{id}` autorizado y cacheado en `worker/src/routes/v1/applications.ts`
- [x] T023 [P] [US-DATA-02] Completar schema/mapper de detalle en `mobile/src/data/schemas/applicationDetail.ts` y `mobile/src/data/mappers/applicationDetailMapper.ts`
- [x] T024 [US-DATA-02] Implementar `get()` real en `mobile/src/data/repositories/RestApplicationRepository.ts`
- [x] T025 [US-DATA-02] Conectar detalle y errores controlados en `mobile/src/presentation/controllers/useApplicationDetailController.ts` y `mobile/src/presentation/components/applications/ApplicationDetail.tsx`

**Checkpoint**: El detalle se puede probar sin depender de la actualización de gestión.

## Phase 5: US-DATA-03 — Conservar contexto de gestión (P2)

**Goal**: Persistir contacto, motivo y ticket sin falso éxito ni pérdida concurrente.

**Independent Test**: Actualizar, abrir sesión nueva y leer como otro usuario; probar 409 y fallo de proveedor.

### Tests

- [x] T026 [P] [US-DATA-03] Escribir tests fallidos de validación, permiso, `If-Match`, 409 y 503 en `worker/tests/contract/application-management.contract.test.ts`
- [x] T027 [P] [US-DATA-03] Escribir test móvil fallido de confirmación/error/último valor en `mobile/tests/component/management-context.test.tsx`
- [ ] T028 [US-DATA-03] Escribir integración Airtable fallida entre dos clientes en `worker/tests/integration/airtable-application-management.test.ts`

### Implementation

- [x] T029 [US-DATA-03] Implementar validación y control optimista en `worker/src/applications/updateManagement.ts`
- [x] T030 [US-DATA-03] Exponer PATCH, persistir y luego invalidar caché en `worker/src/routes/v1/applications.ts`
- [x] T031 [P] [US-DATA-03] Añadir `reason` al dominio/puerto y completar schema/mapper en `mobile/src/domain/model/application.ts`, `mobile/src/domain/ports/ApplicationRepository.ts`, `mobile/src/data/schemas/managementContext.ts` y `mobile/src/data/mappers/managementContextMapper.ts`
- [x] T032 [US-DATA-03] Implementar `updateManagement()` real en `mobile/src/data/repositories/RestApplicationRepository.ts`
- [x] T033 [US-DATA-03] Confirmar UI solo con respuesta persistida y conservar último valor en error en `mobile/src/presentation/components/applications/ManagementContextForm.tsx`

**Checkpoint**: La historia solo se cierra tras ejecutar T028 bajo demanda y releer desde una sesión/proceso nuevo.

## Phase 6: Validation

- [x] T034 [P] Ejecutar validaciones móvil/Worker y actualizar evidencia en `specs/003-datos-representativos-persistentes/quickstart.md`
- [ ] T035 Medir llamadas/registro del seed y escenarios y documentar presupuesto real en `specs/003-datos-representativos-persistentes/plan.md`
- [x] T036 Verificar que 429/agotamiento devuelve error controlado y nunca activa fake en `worker/tests/integration/airtable-rate-limit.test.ts`

## Dependencies & Execution Order

- Requiere la infraestructura y sesión de feature 002 hasta T026.
- T001–T004 → T005–T010 → US-DATA-01; US-DATA-02 puede comenzar tras T009; US-DATA-03 requiere detalle y `updatedAt`.
- Feature 004 depende de aplicaciones persistentes y reutiliza `credentialState/currentCredentialId`.
- Feature 005 conecta el registro persistente de intentos de consulta/actualización antes de cerrar el Sprint completo.

## Parallel Opportunities

- T005–T007 y T010 son paralelos.
- T011–T014, T020/T021 y T026/T027 se escriben en ficheros distintos.
- Mappers móviles marcados [P] pueden avanzar con el contrato congelado.

## Incremental Strategy

1. Sembrar datos y entregar inventario.
2. Añadir detalle.
3. Añadir gestión persistente y prueba entre sesiones.
4. Conectar auditoría 005 y validar cuota antes de declarar la feature completa.
