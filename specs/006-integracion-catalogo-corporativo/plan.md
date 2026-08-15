# Implementation Plan: Integración con catálogo corporativo

**Branch**: `[006-integracion-catalogo-corporativo]` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-integracion-catalogo-corporativo/spec.md`

## Summary

Sustituir la lectura representativa de instituciones, aplicaciones y roles por un adaptador servidor neutral conectado al catálogo corporativo. El Worker consulta el catálogo como fuente autoritativa, aplica alcance y ambiente, y une cada aplicación por identificador estable con el contexto operativo no corporativo conservado en Airtable. Las rutas móviles `/v1/applications` mantienen su contrato para evitar cambios innecesarios en presentación y dominio.

## Technical Context

**Language/Version**: TypeScript 6.0.3 estricto; Node.js 25.9.0 y npm 11.12.1

**Primary Dependencies**: Stack Worker/móvil fijado en 002–005; `fetch`, Zod 4.4.3 y Cloudflare Cache API; sin SDK del proveedor hasta seleccionar el catálogo real

**Storage**: Catálogo corporativo autoritativo para identidad y clasificación; Airtable solo para `ApplicationOperationalContexts` y referencias externas no secretas

**Testing**: Vitest/contratos en Worker, Jest/RNTL móvil y suite bajo demanda contra entorno corporativo autorizado más base Airtable de test

**Target Platform**: Expo Web móvil, Cloudflare Workers y API corporativa HTTPS

**Project Type**: Integración vertical móvil + API serverless + servicio corporativo externo

**Performance Goals**: Una consulta de catálogo por clave de caché cada 60 segundos como máximo; páginas de 20 elementos; cero polling

**Constraints**: Solo lectura sobre catálogo; no fallback a demo; IDs corporativos estables; autorización antes de unir datos; errores externos controlados y auditables

**Scale/Scope**: Catálogo del piloto y dos ambientes; volumen definido por contrato del proveedor antes del checkpoint externo

## Constitution Check

*GATE: Passed with the explicit time-bounded deviation below; re-checked after Phase 1.*

| Gate | Design evidence | Result |
|---|---|---|
| Seguridad y privacidad | Credenciales del catálogo solo como Worker Secrets; allowlist de campos y sin datos sensibles en caché | PASS |
| Mínimo privilegio | Scope de lectura, filtro de ambiente/alcance y autorización remota por petición | PASS |
| Auditabilidad | Éxito, error del proveedor, datos inválidos y rechazo alimentan el registrador de 005/009 | PASS |
| Tres capas móviles | Se conserva `ApplicationRepository`; la UI desconoce la fuente externa | PASS |
| Estado fiable | Catálogo autoritativo, caché máxima 60 s y error al expirar si no puede confirmarse | PASS |
| Testing | Contrato neutral, fixtures de errores y validación contra entorno corporativo autorizado | PASS |
| Simplicidad/versionado | Un adaptador y contrato versionado; sin SDK hasta que el proveedor lo exija | PASS |
| Persistencia | Airtable conserva solo contexto operativo; no replica autoridad corporativa | DEVIATION |

### Excepción constitucional temporal

| Campo | Decisión |
|---|---|
| Principios afectados | VII y XI: Airtable deja de ser fuente autoritativa de identidad/clasificación de aplicaciones durante el piloto |
| Alcance | Institución, aplicación, rol, ambiente y vigencia procedentes del catálogo corporativo |
| Riesgo | Divergencia entre el catálogo y referencias/contexto operativo de Airtable |
| Mitigación | IDs estables, unión bajo demanda, caché de 60 s, control de huérfanos y prohibición de fallback demo |
| Responsable | Seguridad |
| Caducidad | 2026-12-31; antes debe enmendarse la constitución o retirarse la integración |

## Project Structure

### Documentation (this feature)

```text
specs/006-integracion-catalogo-corporativo/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/catalog-provider.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
worker/src/
├── catalog/{CorporateCatalogPort,CorporateCatalogHttpAdapter,catalogSchemas}.ts
├── applications/{listApplications,getApplication,joinOperationalContext}.ts
├── cache/catalogCache.ts
└── routes/v1/applications.ts

mobile/src/
├── data/repositories/RestApplicationRepository.ts
├── domain/ports/ApplicationRepository.ts
└── presentation/controllers/

worker/tests/{unit,contract,integration,security}/
```

**Structure Decision**: El Worker añade un único puerto de catálogo y reutiliza las rutas y modelos móviles existentes. Airtable se consulta únicamente para contexto de gestión y referencias operativas; no se crea una segunda integración por pantalla.

## Design Decisions

- `CorporateCatalogPort.list/get` recibe ambiente y alcance autorizados y devuelve DTO validados con Zod.
- El contrato neutral exige IDs estables, versión/fecha del registro, institución, rol, ambiente y vigencia; el adaptador real traduce el proveedor elegido sin filtrar DTO externos hacia dominio.
- `ApplicationOperationalContexts` usa `(catalogApplicationId, environment)` como clave lógica y conserva contacto, motivo, ticket y referencias de credenciales/auditoría.
- La caché incluye usuario/alcance, ambiente, consulta, página y versión de contrato. TTL máximo: 60 segundos; no se sirve caché expirada cuando el catálogo no responde.
- Duplicados, referencias incompletas o cambios de institución/rol se rechazan como error de datos controlado y auditable; KeyOps no corrige el catálogo.
- El contrato final del proveedor, límites, autenticación y entorno de prueba son un checkpoint externo obligatorio antes de declarar la feature implementable contra producción.

## Delivery and Validation

1. Validar puerto, DTO, alcance, duplicados, caché y ausencia de fallback con fixtures.
2. Ejecutar el contrato neutral contra un stub HTTP local.
3. Conectar el adaptador real solo tras aprobar contrato, scopes y entorno corporativo.
4. Comparar una muestra acordada con el catálogo y comprobar que Airtable contiene únicamente contexto operativo.

