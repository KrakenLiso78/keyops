# Implementation Plan: Ciclo de vida de credenciales sintéticas

**Branch**: `[004-ciclo-credenciales-sinteticas]` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-ciclo-credenciales-sinteticas/spec.md`

## Summary

Implementar el ciclo de vida sintético detrás del puerto `CredentialRepository`, con autorización y máquina de estados en el Worker. Airtable persiste credenciales, versiones, verificadores de entrega e idempotencia. Los artefactos contienen solo valores sintéticos; los códigos se devuelven una vez y Airtable conserva únicamente su digest HMAC, expiración y consumo.

## Technical Context

**Language/Version**: TypeScript 6.0 estricto; Node.js 25.9.0 y npm 11.12.1

**Primary Dependencies**: Stack fijado en 002–003 (Wrangler 4.115.0, Vitest 4.1.10 y Zod 4.4.3), Web Crypto para valores aleatorios/HMAC; sin librería criptográfica ni de estado adicional

**Storage**: Airtable Free: `Credentials`, `CredentialVersions`, `DeliveryGrants`, `IdempotencyRecords`; referencia a `Applications`

**Testing**: Jest para dominio/UI, Vitest para Worker, contratos REST, pruebas de concurrencia/idempotencia y prueba Airtable bajo demanda en proceso nuevo

**Target Platform**: Expo Web móvil + Cloudflare Workers Free

**Project Type**: Flujo vertical crítico en aplicación móvil y API serverless

**Performance Goals**: Una operación crítica por interacción; escrituras agrupadas hasta diez registros; sin polling ni éxito optimista

**Constraints**: una única versión activa; códigos de un solo uso y dos minutos; cero secretos reales; reintentos con `Idempotency-Key`; Airtable no ofrece transacciones multi-registro generales

**Scale/Scope**: Decenas de credenciales sintéticas y entregas efímeras dentro del presupuesto global de 1.000 registros

## Constitution Check

_GATE: Passed before Phase 0 and re-checked after Phase 1._

| Gate              | Design evidence                                                                                                            | Result |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- | ------ |
| Seguridad         | Material completamente sintético; código en claro solo en respuesta/memoria; digest HMAC persistido; redacción obligatoria | PASS   |
| Mínimo privilegio | Cada comando exige permiso, ambiente y recurso; revocación exige perfil senior equivalente                                 | PASS   |
| Auditabilidad     | Cada resultado emite un evento para la feature 005; receipt conserva `requestId` y `auditEventId` cuando esté activa       | PASS   |
| Tres capas        | Máquina de estados/casos de uso en dominio; repositorio REST en datos; UI solo confirma/intenta/representa                 | PASS   |
| Estado fiable     | Sin optimismo ni cola offline; relectura tras confirmación; idempotencia remota                                            | PASS   |
| Testing           | Transiciones, permisos, doble solicitud, fallos intermedios y ausencia de secretos; integración Airtable                   | PASS   |
| Simplicidad/coste | Web Crypto y tablas pequeñas; no vault, cola ni servicio de entrega porque los datos son sintéticos                        | PASS   |
| Versionado        | Operaciones `/v1`, DTO validados y registros con `schemaVersion`                                                           | PASS   |
| Persistencia      | Estados/versiones/idempotencia sobreviven sesiones; el fake no constituye evidencia                                        | PASS   |

No hay violaciones constitucionales que justificar. La ausencia de transacciones globales de Airtable se mitiga con estados `pending/committed`, un registro idempotente y recuperación determinista; esta feature no afirma garantías de credenciales reales.

## Project Structure

### Documentation (this feature)

```text
specs/004-ciclo-credenciales-sinteticas/
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
├── domain/{model,ports,use-cases}/
└── presentation/{controllers,components/credentials,state}/

worker/src/
├── airtable/{CredentialRepository,DeliveryGrantRepository,IdempotencyRepository}.ts
├── credentials/{stateMachine,operationService,syntheticDelivery}.ts
├── auth/authorize.ts
└── routes/v1/credentials.ts

worker/tests/{unit,contract,integration,security}/
```

**Structure Decision**: Las reglas de transición viven en funciones puras del Worker y se reflejan en los casos de uso móviles para habilitar/deshabilitar acciones, pero solo el Worker decide. Los repositorios Airtable permanecen en el único adaptador servidor.

## Design Decisions

- Todos los comandos críticos usan `Idempotency-Key`. El Worker guarda clave, usuario, ambiente, operación, huella del comando, estado y receipt; reutilizar la clave con otro contenido devuelve `409`.
- Una operación se reserva como `processing`, escribe su estado con `operationId`, y termina `committed` con el receipt. Un reintento recupera o finaliza la misma operación, nunca crea otra versión.
- Regenerar crea una versión `pending`, valida de nuevo la versión vigente y agrupa la desactivación anterior y activación nueva. Si la confirmación queda incierta, la siguiente ejecución reconcilia por `operationId` antes de responder.
- Airtable conserva `codeDigest = HMAC(DELIVERY_PEPPER, deliveryId + code)`, `expiresAt` y `consumedAt`, nunca el código. Una nueva entrega invalida verificadores anteriores de la misma versión.
- El artefacto descargable es JSON/texto generado al vuelo con identificadores y una marca inequívoca `SYNTHETIC-NON-FUNCTIONAL`; no contiene Client Secret ni concede acceso.
- `RestCredentialRepository` implementa los puertos existentes y nunca repite automáticamente un POST sin conservar la misma clave idempotente.

## Failure Model

| Failure point                       | Behavior                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- |
| Authorization or invalid transition | Reject before mutation; emit rejected audit envelope                                                |
| Airtable throttling                 | Controlled retryable error; retain last confirmed UI state                                          |
| Response lost after commit          | Same idempotency key returns original receipt                                                       |
| Pending regeneration                | Reconcile versions by operation ID; expose no success until exactly one active version is confirmed |
| Expired/used delivery code          | Reject and preserve consumed/expired state                                                          |

## Delivery and Validation

Cada historia se valida con tests de reglas y contrato. La evidencia persistente ejecuta emisión, rotación, transición o entrega contra Airtable de test, crea un cliente/proceso nuevo y comprueba estado e idempotencia. La inspección de respuestas, logs y registros busca patrones de secretos y confirma que solo existen datos sintéticos.

### Presupuesto observado de integración

El recorrido persistente completo consume 88 peticiones Airtable y alcanza simultáneamente un
registro de credencial, dos versiones y tres entregas. El reintento de emisión conserva el mismo
efecto; el escenario termina revocado y elimina sus seis registros de prueba. Una ejecución supone
el 8,8 % de las 1.000 peticiones mensuales del plan Free, por lo que se mantiene bajo demanda y no
forma parte del polling ni de la navegación normal.
