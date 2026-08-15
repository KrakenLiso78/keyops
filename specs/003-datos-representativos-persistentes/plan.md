# Implementation Plan: Datos representativos persistentes

**Branch**: `[003-datos-representativos-persistentes]` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-datos-representativos-persistentes/spec.md`

## Summary

Persistir un inventario representativo en Airtable y exponerlo mediante rutas `/v1/applications` del Worker. El adaptador aplica ambiente, permisos, búsqueda normalizada, orden y paginación, valida DTO con Zod y cachea lecturas breves. El cliente implementa el repositorio REST real y confirma una gestión solo después de releer la respuesta persistida.

## Technical Context

**Language/Version**: TypeScript 6.0 estricto; Node.js 25.9.0 y npm 11.12.1

**Primary Dependencies**: Stack fijado en la feature 002 (Wrangler 4.115.0, Vitest 4.1.10 y Zod 4.4.3); `fetch` y Cloudflare Cache API sin librería adicional

**Storage**: Airtable Free: `Institutions`, `ApiRoles` y `Applications`; base separada para integración

**Testing**: Jest/RNTL móvil, Vitest Worker, contratos REST y prueba Airtable bajo demanda con lectura desde una sesión/proceso nuevo

**Target Platform**: Expo Web móvil y Cloudflare Workers Free

**Project Type**: Extensión vertical de aplicación móvil + API serverless

**Performance Goals**: Página inicial con una petición del cliente; páginas de máximo 20 elementos; caché breve de listas y detalles no sensibles; cero polling

**Constraints**: 20+ aplicaciones representativas; total de la base <1.000 registros; 1.000 llamadas/mes; páginas Airtable de 100 y lotes de 10; sin secretos ni fallback fake

**Scale/Scope**: Dos ambientes, varias instituciones/roles y al menos 20 aplicaciones; actualización de contexto de gestión, no administración de catálogo

## Constitution Check

*GATE: Passed before Phase 0 and re-checked after Phase 1.*

| Gate | Design evidence | Result |
|---|---|---|
| Seguridad/privacidad | Campos permitidos por DTO; no se consulta ni devuelve material de entrega | PASS |
| Mínimo privilegio | Worker filtra por ambiente y alcance y exige `applications:read`; las escrituras se autorizan aparte | PASS |
| Tres capas | Casos de uso existentes consumen `ApplicationRepository`; `RestApplicationRepository` encapsula HTTP | PASS |
| Estado fiable | Respuesta del Worker es la única confirmación; errores conservan el último modelo confirmado | PASS |
| Testing | Búsqueda/filtros en unidad y contrato; persistencia entre procesos contra Airtable de test | PASS |
| Simplicidad/coste | Tres tablas normalizadas, API existente, Cache API y sin motor de búsqueda adicional | PASS |
| Versionado | Contrato `/v1` y esquemas Zod explícitos | PASS |
| Persistencia | Datos y gestiones se releen desde Airtable; fake no prueba la historia | PASS |

No hay violaciones constitucionales que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/003-datos-representativos-persistentes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/mobile-api.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
mobile/src/
├── data/{repositories,schemas,mappers}/
├── domain/{ports,use-cases}/
└── presentation/{controllers,components/applications}/

worker/src/
├── airtable/{AirtableClient,ApplicationRepository,mappers,schemas}.ts
├── auth/authorize.ts
├── cache/applicationCache.ts
└── routes/v1/applications.ts

worker/tests/{unit,contract,integration}/
```

**Structure Decision**: Se extiende la infraestructura única creada en 002. Las tablas Airtable y sus DTO nunca atraviesan el puerto de dominio; los mappers del Worker construyen el contrato REST y los mappers móviles construyen el modelo de dominio.

## Design Decisions

- `GET /v1/applications` exige `environment`, admite `query`, filtros, `sort`, `page` y fija `pageSize=20`.
- Para el volumen del caso de estudio, el Worker obtiene páginas Airtable necesarias, normaliza texto con Unicode NFD y filtra los campos autorizados. No se incorpora un índice externo.
- La clave de caché incluye versión de contrato, usuario/alcance, ambiente y consulta normalizada. Las actualizaciones invalidan listas y detalle afectados.
- `PATCH /v1/applications/{id}/management` usa `If-Match` con `updatedAt` para detectar edición concurrente y devuelve `409` sin sobrescribir silenciosamente.
- Airtable IDs no salen como identidad de negocio: los registros contienen `institutionId`, `roleId` y `applicationId` estables.
- El seed es idempotente mediante upsert por identificador y agrupa lotes de hasta diez.

## Capacity Budget

| Data | Budget |
|---|---:|
| Institutions | 24 |
| API roles | 4 |
| Applications | 24 |
| Users from 002 | 6 |
| Reserved credentials/delivery/idempotency | 250 |
| Reserved audit events | 650 |
| Operational margin | 42 |
| **Maximum** | **1,000** |

## Delivery and Validation

Validar primero mappers, normalización, autorización y conflictos. Ejecutar después contrato local y una prueba bajo demanda que actualice una gestión, destruya el cliente/sesión, vuelva a leerla con otro usuario autorizado y restaure el fixture. Medir el número de llamadas y confirmar que no existe polling.
