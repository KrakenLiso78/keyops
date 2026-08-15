# Implementation Plan: Credenciales reales y entrega segura

**Branch**: `[008-credenciales-reales-entrega]` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-credenciales-reales-entrega/spec.md`

## Summary

Conectar el Worker con servicios corporativos de credenciales y entrega mediante `CredentialProviderPort` y `SecureDeliveryPort`. El proveedor real es autoritativo para secretos, versiones y aceptación efectiva; Airtable conserva solo referencias, estados confirmados, idempotencia y receipts no secretos. Un contrato `/v2` separa inequívocamente operaciones reales del flujo sintético `/v1`.

## Technical Context

**Language/Version**: TypeScript 6.0.3 estricto; Node.js 25.9.0 y npm 11.12.1

**Primary Dependencies**: Stack 002–007; `fetch`, Zod 4.4.3, Web Crypto y adaptadores HTTP neutrales; sin SDK/vault adicional hasta seleccionar servicios reales

**Storage**: Servicio corporativo autoritativo para credenciales/secretos; servicio de entrega para ZIP/contraseña/OTP; Airtable solo metadatos no secretos

**Testing**: Vitest/contratos y fallos por paso, Jest/RNTL para UI, pruebas E2E en entorno corporativo autorizado y análisis de secretos

**Target Platform**: Expo Web móvil, Cloudflare Worker y servicios corporativos HTTPS

**Project Type**: Operaciones críticas móviles con dos integraciones servidor de confianza

**Performance Goals**: Una operación explícita por interacción; reintento idempotente; cero polling y cero éxito optimista

**Constraints**: Una sola versión real activa; ZIP cifrado; contraseña distinta de OTP; OTP un uso/dos minutos; ningún secreto en Airtable/cliente persistente/logs

**Scale/Scope**: Aplicaciones autorizadas del piloto; proveedores y límites concretos aprobados en checkpoint externo

## Constitution Check

*GATE: Passed with the explicit time-bounded deviation below; re-checked after Phase 1.*

| Gate | Design evidence | Result |
|---|---|---|
| Seguridad | Generación/entrega fuera del dispositivo, secretos efímeros, canales separados y redacción | PASS |
| Mínimo privilegio | Catálogo/identidad 006–007, permisos por comando y scopes mínimos del proveedor | PASS |
| Auditabilidad | Cada intento usa request/operation ID y requiere confirmación auditada/reconciliable | PASS |
| Tres capas | Puertos de dominio/datos sustituyen fake sin acceso de UI al proveedor | PASS |
| Estado fiable | Servicio real autoritativo, sin optimismo, idempotencia y consulta de estado para reconciliar | PASS |
| Testing | Transiciones efectivas, fallos parciales, reintento, OTP y búsqueda de secretos en entorno autorizado | PASS |
| Simplicidad/versionado | Dos puertos mínimos y `/v2`; `/v1` sintético permanece compatible | PASS |
| Persistencia | Airtable deja de gobernar secreto/aceptación real y conserva solo metadatos | DEVIATION |

### Excepción constitucional temporal

| Campo | Decisión |
|---|---|
| Principios afectados | VII y XI: el servicio corporativo sustituye a Airtable como fuente autoritativa de credenciales reales |
| Alcance | Emisión, versiones, estado efectivo, revocación, ZIP, contraseña y OTP |
| Riesgo | Divergencia entre resultado externo, metadata Airtable y auditoría tras una respuesta incierta |
| Mitigación | Idempotency-Key, operation ID externo, consulta/reconciliación, estados pending/confirmed y sin éxito anticipado |
| Responsable | Seguridad |
| Caducidad | 2026-12-31; antes debe enmendarse la constitución o retirarse la integración |

## Project Structure

### Documentation (this feature)

```text
specs/008-credenciales-reales-entrega/
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
├── credentials/real/{CredentialProviderPort,CredentialProviderHttpAdapter,realOperationService}.ts
├── delivery/{SecureDeliveryPort,SecureDeliveryHttpAdapter}.ts
├── airtable/RealCredentialReferenceRepository.ts
└── routes/v2/credentials.ts

mobile/src/
├── data/repositories/RestCredentialRepository.ts
├── domain/ports/CredentialRepository.ts
└── presentation/{controllers,components/credentials}/

worker/tests/{unit,contract,integration,security}/
```

**Structure Decision**: Se reutilizan dominio/UI y se sustituye la composición de datos. `/v2` hace explícito el cambio de seguridad y semántica; la selección real/sintética es configuración servidor por entorno, nunca un parámetro libre del cliente.

## Design Decisions

- `CredentialProviderPort` define issue, rotate, suspend, reactivate, revoke, status y acceptance probe con operation ID/idempotency key.
- `SecureDeliveryPort.prepare` recibe un handle sellado del proveedor y devuelve identificadores/expiración/canales, no Client Secret en DTO persistible.
- El proveedor de entrega genera ZIP cifrado, contraseña y OTP distintos. OTP dura dos minutos/un uso; contraseña y OTP se transmiten por canales corporativos separados aprobados.
- El Worker no registra cuerpos del proveedor. Si recibe material en claro por limitación externa, permanece solo en variables locales durante la invocación y se excluye de logs, errores, Airtable y receipts.
- Airtable `RealCredentialReferences` conserva external ID, aplicación/ambiente, versión/estado confirmado, operation ID, timestamps y delivery handle opaco; nunca secretos.
- Respuesta perdida: el mismo Idempotency-Key consulta/reconcilia el operation ID externo y devuelve un único receipt. Una rotación no se confirma hasta probar nueva activa y anterior inutilizable.
- Si la credencial cambia pero la entrega/auditoría falla, el estado queda `reconciliation_required`; el reintento recupera la operación, nunca emite otra credencial.

## Delivery and Validation

1. Tests puros/contrato con proveedor simulado, incluidos fallos después de cada paso.
2. Validación móvil de confirmaciones, no optimismo, memoria y redacción.
3. Checkpoint externo: contratos, scopes, sandbox, canales y responsables aprobados.
4. E2E real: emitir/rotar/transicionar/revocar, acceptance probe, OTP usado/caducado y reintento incierto.

