# Implementation Plan: Auditoría funcional persistente

**Branch**: `[005-auditoria-funcional]` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-auditoria-funcional/spec.md`

## Summary

Añadir un registrador de auditoría transversal al Worker que persiste eventos append-only en Airtable para accesos y operaciones de las features 002–004. Exponer una consulta paginada y autorizada con filtros. La aplicación implementa `RestAuditRepository`; no ofrece actualizar ni eliminar eventos y nunca incorpora materiales de entrega.

## Technical Context

**Language/Version**: TypeScript 6.0 estricto; Node.js 25.9.0 y npm 11.12.1

**Primary Dependencies**: Stack fijado en 002–004 (Wrangler 4.115.0, Vitest 4.1.10 y Zod 4.4.3), `fetch` y utilidades propias de redacción; sin plataforma externa de observabilidad

**Storage**: Tabla Airtable `AuditEvents`, append-only desde el Worker; base de test separada

**Testing**: Vitest para normalización/redacción y middleware; Jest/RNTL para consulta; contrato REST; integración Airtable bajo demanda con éxito, fallo y rechazo

**Target Platform**: Expo Web móvil + Cloudflare Workers Free

**Project Type**: Capacidad transversal de API serverless y pantalla móvil existente

**Performance Goals**: Escritura de un evento por intento relevante, en la misma petición; consulta paginada de 20 eventos; cero polling

**Constraints**: reserva de 650 registros; eventos sin edición/eliminación desde API; orden determinista; no se afirma inmutabilidad administrativa ni retención de cinco años

**Scale/Scope**: Eventos de acceso, inventario, gestión y credenciales sintéticas del Sprint; tres perfiles autorizados para consulta

## Constitution Check

*GATE: Passed before Phase 0 and re-checked after Phase 1.*

| Gate | Design evidence | Result |
|---|---|---|
| Seguridad/privacidad | Allowlist de campos, causas seguras y redacción antes de persistir; no hay body completo ni material de entrega | PASS |
| Mínimo privilegio | Consulta exige `audit:read`; no existen endpoints de mutación de eventos | PASS |
| Auditabilidad | Éxito, fallo y rechazo pasan por un finalizador común y escriben actor/recurso/ambiente/IP/tiempo | PASS |
| Tres capas | `AuditRepository` móvil consume REST; UI filtra/representa; persistencia solo en Worker | PASS |
| Estado fiable | La respuesta crítica no afirma éxito si el evento requerido no pudo persistirse; errores controlados | PASS |
| Testing | Cobertura de tres resultados, permiso, filtros, orden y redacción; integración persistente | PASS |
| Simplicidad/coste | Una tabla y un middleware/finalizador; sin SIEM, cola o analítica | PASS |
| Versionado | Contrato `/v1`, `schemaVersion` en evento y Zod en ambos límites | PASS |
| Evidencia honesta | Se valida trazabilidad funcional, no inmutabilidad frente a administradores ni cinco años | PASS |

No hay violaciones constitucionales que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/005-auditoria-funcional/
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
└── presentation/{controllers,components/audit}/

worker/src/
├── airtable/AuditEventRepository.ts
├── audit/{AuditRecorder,auditEventFactory,redactAudit}.ts
├── http/{requestContext,completeOperation}.ts
└── routes/v1/audit.ts

worker/tests/{unit,contract,integration,security}/
```

**Structure Decision**: Un `requestContext` crea `requestId`, actor, IP y tiempo; los handlers pasan su resultado al único `completeOperation`. El repositorio Airtable solo permite `append` y `list`. La feature modifica los puntos de entrada de 002–004 para cubrir intentos, pero no duplica sus reglas de negocio.

## Design Decisions

- El registrador recibe campos explícitos, no bodies o headers completos. Una allowlist elimina token, password, OTP, URL y cualquier clave de secreto antes de validar con Zod.
- Los rechazos de autenticación usan un actor seguro (`anonymous` o identificador no revelador); los recursos inexistentes pueden omitir IDs no confirmados.
- Para operaciones gobernadas por FR-AUD-001, persistir el evento es parte de completar la petición. Si Airtable falla, se devuelve error controlado y no se comunica éxito; los comandos idempotentes pueden recuperar el resultado y completar el evento al reintentar.
- `GET /v1/audit-events` exige `audit:read`, admite fechas, institución, aplicación, usuario y resultado, y ordena por `occurredAt desc, eventId desc`.
- La API no define `PATCH`, `PUT` ni `DELETE` para eventos. Esto demuestra append-only desde la aplicación, no inmutabilidad administrativa.
- Se aplica un presupuesto y limpieza explícita solo a fixtures de test; los datos de demostración no se borran silenciosamente.

## Delivery and Validation

1. Unit tests de fábrica, redacción, orden y permisos.
2. Contract tests de lista/filtros y ausencia de rutas de mutación.
3. Integrar finalización en sesión, gestión y comandos de credenciales.
4. Prueba Airtable bajo demanda con un éxito, un fallo y un rechazo, seguida de lectura desde proceso nuevo.
5. Inspección automatizada de registros para cero secretos y recuento de presupuesto.
