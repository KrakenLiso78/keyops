# Tasks: Integración con catálogo corporativo

**Input**: Design documents from `/specs/006-integracion-catalogo-corporativo/`

**Tests**: Obligatorios por constitución y por dependencia externa. Los tests se escriben primero y deben observar el fallo esperado.

## Phase 1: Setup

- [x] T001 Crear estructura de catálogo en `worker/src/catalog/` y fixtures en `worker/tests/fixtures/catalog/`
- [x] T002 [P] Añadir configuración sin secretos y validación de bindings del catálogo en `worker/src/config/env.ts` y `worker/.dev.vars.example`
- [x] T003 [P] Documentar checklist de contrato/propietario/scopes/límites en `worker/docs/corporate-catalog-checkpoint.md`

## Phase 2: Foundational

- [x] T004 [P] Definir `CorporateCatalogPort` y tipos internos en `worker/src/catalog/CorporateCatalogPort.ts`
- [x] T005 [P] Implementar schemas Zod del contrato neutral en `worker/src/catalog/catalogSchemas.ts`
- [x] T006 [P] Crear stub HTTP con páginas, errores y duplicados en `worker/tests/support/CorporateCatalogStub.ts`
- [x] T007 Implementar adapter HTTP neutral y traducción de errores en `worker/src/catalog/CorporateCatalogHttpAdapter.ts`
- [x] T008 [P] Implementar caché segmentada con TTL máximo 60 s en `worker/src/cache/catalogCache.ts`
- [x] T009 Definir el delta de esquema `ApplicationOperationalContexts` en `worker/scripts/airtable/README.md` e implementar su repositorio en `worker/src/airtable/ApplicationOperationalContextRepository.ts`
- [x] T010 Implementar unión por ID externo/ambiente y detección de huérfanos en `worker/src/applications/joinOperationalContext.ts`
- [x] T011 Conectar el puerto por inyección explícita en `worker/src/composition/createWorkerDependencies.ts`

**Checkpoint**: El adapter neutral y la unión pueden probarse sin proveedor real y sin fallback demo.

## Phase 3: US-CAT-01 — Consultar el catálogo corporativo (P1)

**Goal**: Mostrar catálogo vigente, autorizado y de solo lectura unido al contexto KeyOps.

**Independent Test**: Cambio del catálogo visible tras 60 s, alcance/ambiente correctos, cero escrituras y error controlado ante indisponibilidad.

### Tests

- [x] T012 [P] [US-CAT-01] Escribir tests fallidos de schemas, duplicados e incompletos en `worker/tests/unit/catalogSchemas.test.ts`
- [x] T013 [P] [US-CAT-01] Escribir tests fallidos de alcance, ambiente, cambio y caché en `worker/tests/unit/catalogQuery.test.ts`
- [x] T014 [P] [US-CAT-01] Escribir contrato fallido del provider neutral en `worker/tests/contract/catalog-provider.contract.test.ts`
- [x] T015 [P] [US-CAT-01] Escribir tests fallidos de unión/contexto huérfano en `worker/tests/unit/catalogJoin.test.ts`
- [x] T016 [P] [US-CAT-01] Escribir test de seguridad fallido de scopes/campos/logs en `worker/tests/security/catalog-redaction.test.ts`
- [x] T017 [P] [US-CAT-01] Escribir test móvil fallido de loading/error sin fallback en `mobile/tests/component/applications/corporateCatalogList.test.tsx`

### Implementation

- [x] T018 [US-CAT-01] Implementar consulta autorizada de catálogo en `worker/src/applications/listCorporateApplications.ts`
- [x] T019 [US-CAT-01] Implementar detalle autorizado y vigencia en `worker/src/applications/getCorporateApplication.ts`
- [x] T020 [US-CAT-01] Sustituir lectura de inventario por catálogo+contexto en `worker/src/routes/v1/applications.ts`
- [x] T021 [US-CAT-01] Bloquear mutaciones de campos corporativos y conservar solo gestión en `worker/src/routes/v1/applications.ts`
- [x] T022 [US-CAT-01] Invalidar consultas del ambiente anterior sin polling en `mobile/src/presentation/controllers/useApplicationListController.ts`
- [x] T023 [US-CAT-01] Mostrar indisponibilidad y datos externos inválidos sin demo en las pantallas bajo `mobile/src/presentation/components/applications/`
- [x] T024 [US-CAT-01] Emitir resultados auditables seguros para lectura/rechazo/error en `worker/src/routes/v1/applications.ts`

**Checkpoint**: La historia funciona contra stub y Airtable de test; no está validada para piloto sin T029–T031.

## Phase 4: Persistence and corporate validation

- [x] T025 [P] Crear integración Airtable de contexto entre procesos en `worker/tests/integration/airtable-operational-context.test.ts`
- [x] T026 [P] Crear prueba de cero métodos de escritura al provider en `worker/tests/contract/catalog-read-only.contract.test.ts`
- [x] T027 Ejecutar suites y documentar evidencia local en `specs/006-integracion-catalogo-corporativo/quickstart.md`
- [x] T028 Registrar la excepción constitucional, responsable y caducidad en la evidencia de release `worker/docs/corporate-catalog-checkpoint.md`
- [ ] T029 Obtener y registrar contrato, owner, límites, IDs y entorno real en `worker/docs/corporate-catalog-checkpoint.md`
- [ ] T030 Implementar el adapter concreto tras T029 en `worker/src/catalog/CorporateCatalogProviderAdapter.ts`
- [ ] T031 Ejecutar reconciliación de muestra/indisponibilidad contra entorno autorizado en `worker/tests/integration/corporate-catalog.pilot.test.ts`
- [ ] T032 Confirmar cero registros fuera de alcance y cero modificaciones corporativas en `specs/006-integracion-catalogo-corporativo/quickstart.md`
- [x] T033 Crear `ApplicationOperationalContexts` mediante la migración aditiva y ejecutar T025 contra Airtable

## Dependencies & Execution Order

- Requiere sesión/autorización 002/007 y auditoría funcional 005; puede construir el adapter neutral en paralelo con 007.
- T001–T011 bloquean US-CAT-01; T012–T017 preceden T018–T024.
- T029 es un checkpoint externo: T030–T032 no pueden completarse con stubs.
- 008 requiere T031 para operar sobre aplicaciones reales.

## Parallel Opportunities

- T002/T003, T004–T006/T008 y T012–T017 trabajan en ficheros distintos.
- T025 y T026 pueden ejecutarse en paralelo tras la historia.

## Incremental Strategy

1. Puerto, contrato y stub.
2. Consulta/union completa sin proveedor concreto.
3. Persistencia de contexto y seguridad.
4. Adapter real y evidencia corporativa.
