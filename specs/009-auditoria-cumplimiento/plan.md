# Implementation Plan: Auditoría de cumplimiento y retención

**Branch**: `[009-auditoria-cumplimiento]` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-auditoria-cumplimiento/spec.md`

## Summary

Sustituir Airtable como autoridad de auditoría del piloto por un almacén corporativo WORM mediante `ComplianceAuditPort`. El Worker envía eventos versionados e idempotentes, exige acuse persistente antes de confirmar una operación auditable y permite consulta/verificación/recuperación mediante `/v2/audit-events`. Airtable conserva solo la auditoría funcional del caso de estudio.

## Technical Context

**Language/Version**: TypeScript 6.0.3 estricto; Node.js 25.9.0 y npm 11.12.1

**Primary Dependencies**: Stack 002–008; `fetch`, Zod 4.4.3, Web Crypto y adaptador HTTPS neutral; capacidades WORM/retention lock del servicio corporativo existente

**Storage**: Almacén corporativo inmutable autoritativo con retención de cinco años; Airtable no acredita cumplimiento

**Testing**: Vitest/contratos, pruebas de manipulación e idempotencia, recovery drill y E2E autorizado; Jest/RNTL para consulta/verificación

**Target Platform**: Expo Web móvil, Cloudflare Worker y servicio corporativo de cumplimiento

**Project Type**: Auditoría transversal con almacén externo gobernado

**Performance Goals**: Un append idempotente por intento; consulta paginada de 20; sin polling; recuperación verificable por lote

**Constraints**: WORM frente a usuarios/administradores operativos, retención 5 años, evolución legible, cero secretos/PII innecesaria, orden determinista

**Scale/Scope**: Eventos de acceso, catálogo, usuarios y credenciales reales del piloto; capacidad aprobada por Compliance antes de activar

## Constitution Check

*GATE: Passed with the explicit time-bounded deviation below; re-checked after Phase 1.*

| Gate | Design evidence | Result |
|---|---|---|
| Seguridad/privacidad | Allowlist, redacción previa y cifrado/transporte del proveedor; sin cuerpos ni secretos | PASS |
| Mínimo privilegio | Credenciales separadas de append/query/admin y consulta por perfil | PASS |
| Auditabilidad | WORM, cinco años, intentos de alteración, integridad y recovery drill | PASS |
| Estado fiable | Acuse idempotente/reconciliación antes de confirmar; Airtable no se usa como fallback de cumplimiento | PASS |
| Testing | Contrato, tamper tests, muestra versionada y recuperación | PASS |
| Simplicidad/versionado | Un puerto y `/v2`; no se implementa SIEM/analítica fuera de alcance | PASS |
| Persistencia | Servicio WORM sustituye a Airtable como autoridad de auditoría del piloto | DEVIATION |

### Excepción constitucional temporal

| Campo | Decisión |
|---|---|
| Principios afectados | VII, X y XI: el almacén WORM sustituye a Airtable como fuente autoritativa y puede introducir condiciones externas de capacidad/coste |
| Alcance | Eventos del piloto, integridad verificable, retención cinco años y recuperación |
| Riesgo | Pérdida/duplicado entre operación y append o dependencia de configuración administrativa del proveedor |
| Mitigación | Event ID idempotente, acuse persistente, reconciliación, export de política, prueba de alteración y recovery drill |
| Responsable | Seguridad |
| Caducidad | 2026-12-31; antes debe enmendarse la constitución o retirarse la integración |

## Project Structure

### Documentation (this feature)

```text
specs/009-auditoria-cumplimiento/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/mobile-api-v2.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
worker/src/
├── compliance/{ComplianceAuditPort,ComplianceAuditHttpAdapter,eventEnvelope,integrity}.ts
├── audit/{AuditRecorder,reconcileAudit}.ts
└── routes/v2/audit.ts

mobile/src/
├── data/repositories/RestAuditRepository.ts
├── domain/model/audit.ts
└── presentation/{controllers,components/audit}/

worker/tests/{unit,contract,integration,security,recovery}/
```

**Structure Decision**: Se conserva el registrador transversal de 005 y se cambia su sink por composición. `/v1` sigue consultando auditoría funcional del caso de estudio; `/v2` usa exclusivamente el almacén WORM y muestra estado de integridad.

## Design Decisions

- `ComplianceAuditPort.append/query/verify` y `runRecoveryProbe` definen capacidades mínimas; el adaptador real debe acreditar WORM y retention lock de cinco años.
- El evento canónico incluye event ID, schema version, actor, acción, recurso, ambiente, resultado, IP, timestamp, request/operation ID y `integrityReference`; excluye secretos y PII no necesaria.
- Append usa event ID como idempotency key. Un acuse persistente del proveedor forma parte de completar la operación; respuesta incierta se consulta/reconcilia antes de reenviar.
- Una operación externa ya efectiva que no pudo auditarse queda `reconciliation_required`; no se repite y el reintento completa el evento con el resultado confirmado.
- No existen rutas update/delete. Los intentos administrativos/operativos de alteración se prueban contra el proveedor y generan un nuevo evento.
- `schemaVersion` y upcasters de lectura mantienen legibilidad; cambios incompatibles crean nueva versión de API/evento con migración documentada.
- Validación de cinco años usa export verificable de política/retention lock, fixtures de distintas versiones/antigüedades y recovery drill; no simula el paso del tiempo como única evidencia.

## Delivery and Validation

1. Tests de evento, redacción, idempotencia, orden y upcasting con adapter fake.
2. Contract tests contra stub HTTP, incluidos timeout/acuse perdido.
3. Checkpoint de Compliance: proveedor, responsables, WORM, retención, backups y recuperación aprobados.
4. Pruebas autorizadas de modificación/eliminación, consulta de muestra y recovery drill con evidencia.

