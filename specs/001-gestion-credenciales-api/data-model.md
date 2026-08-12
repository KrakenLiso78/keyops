# Phase 1 — Modelo de dominio móvil

**Feature**: `001-gestion-credenciales-api`

**Fuente de verdad**: servicio remoto

**Persistencia local**: únicamente tokens de sesión en SecureStore

Este documento describe entidades de dominio y proyecciones que consume KeyOps.
No define tablas ni una base de datos móvil. Ninguna entidad operativa se
persiste en el dispositivo.

## Tipos comunes

| Tipo                     | Forma                                                   | Validación                                                        |
| ------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------- |
| `EntityId`               | `string`                                                | Identificador opaco, no vacío; el cliente no interpreta prefijos. |
| `Instant`                | `string`                                                | RFC 3339 en UTC; se rechazan fechas inválidas.                    |
| `Environment`            | `test \| production`                                    | Obligatorio en todo recurso y operación operativos.               |
| `CredentialState`        | `active \| suspended \| rotated_inactive \| revoked`    | Estado persistido por el servicio.                                |
| `CredentialDisplayState` | `no_credentials \| CredentialState`                     | `no_credentials` representa ausencia de credencial utilizable.    |
| `UserProfile`            | `analyst \| senior_analyst \| administrator \| auditor` | Determina visibilidad local; el servicio reautoriza.              |
| `OperationResult`        | `succeeded \| failed \| rejected`                       | Resultado autoritativo del servicio.                              |
| `ContractVersion`        | `"1"`                                                   | Cualquier otro valor se rechaza en el adaptador de datos.         |

## Entidades y proyecciones

### AuthenticatedUser

Usuario de la sesión activa.

| Campo             | Tipo           | Regla                                                  |
| ----------------- | -------------- | ------------------------------------------------------ |
| `id`              | `EntityId`     | Obligatorio.                                           |
| `loginIdentifier` | `string`       | No vacío; solo para presentación.                      |
| `displayName`     | `string`       | No vacío.                                              |
| `profile`         | `UserProfile`  | Uno de los cuatro perfiles del MVP.                    |
| `enabled`         | `boolean`      | Debe ser `true` para mantener una sesión operativa.    |
| `permissions`     | `Permission[]` | Proyección del servidor; no sustituye su autorización. |

Los access/refresh tokens pertenecen al adaptador de sesión y no a esta entidad.

### SessionTokens

Único dato persistido en el dispositivo.

| Campo          | Tipo      | Regla                                           |
| -------------- | --------- | ----------------------------------------------- |
| `accessToken`  | `string`  | No vacío; SecureStore; nunca se registra.       |
| `refreshToken` | `string?` | SecureStore solo si el servicio lo proporciona. |

`expiresAt` pertenece a la proyección de sesión en memoria y se revalida con el
servicio al restaurar. Al cerrar sesión, caducar o recibir 401 se eliminan todos
los tokens y el estado de sesión.

### Institution

Referencia de solo lectura al catálogo externo.

| Campo  | Tipo       | Regla        |
| ------ | ---------- | ------------ |
| `id`   | `EntityId` | Obligatorio. |
| `name` | `string`   | No vacío.    |

Una institución agrupa muchas aplicaciones. KeyOps no la crea ni modifica.

### ApiRole

Rol de consumo asignado a una aplicación por el catálogo externo.

| Campo                | Tipo       | Regla                                                                        |
| -------------------- | ---------- | ---------------------------------------------------------------------------- |
| `id`                 | `EntityId` | Obligatorio.                                                                 |
| `name`               | `string`   | Texto visible del catálogo.                                                  |
| `serviceIdentifiers` | `string[]` | Lista sin duplicados; puede estar vacía si el catálogo no detalla servicios. |

KeyOps no crea ni modifica roles de API.

### IntegratedApplication

Agregado de consulta para una integración en un ambiente.

| Campo             | Tipo                      | Regla                                              |
| ----------------- | ------------------------- | -------------------------------------------------- |
| `id`              | `EntityId`                | Identidad opaca dentro del ambiente.               |
| `name`            | `string`                  | No vacío.                                          |
| `institution`     | `Institution`             | Exactamente una.                                   |
| `environment`     | `Environment`             | Debe coincidir con la ruta solicitada.             |
| `apiRole`         | `ApiRole`                 | Exactamente uno.                                   |
| `declaredIps`     | `string[]`                | Cada valor es IPv4 o IPv6 válida; sin duplicados.  |
| `management`      | `ManagementContext`       | Contexto editable de la aplicación/ambiente.       |
| `credentialState` | `CredentialDisplayState`  | Derivado por el servicio.                          |
| `credential`      | `Credential?`             | Ausente cuando `credentialState = no_credentials`. |
| `stateHistory`    | `CredentialStateChange[]` | Orden cronológico descendente para consulta.       |
| `lastChangedAt`   | `Instant`                 | Último cambio confirmado por el servicio.          |

Las consultas de otro ambiente no se fusionan con esta instancia.

#### Proyección de búsqueda del inventario

El índice de búsqueda se deriva únicamente de `id`, `name`, `institution`,
`apiRole`, `declaredIps`, `management.technicalContact`,
`management.requestOrTicketId`, `credential.clientId`, `credentialState` y los
`actorDisplayName` de `stateHistory`. La consulta y esos valores se normalizan
sin distinguir mayúsculas ni acentos antes de comparar.

La proyección excluye de forma expresa Client Secret, OTP, contraseña ZIP,
enlaces de entrega y cualquier campo no incluido en la lista. El ambiente se
aplica antes de buscar; nunca se mezclan resultados de Pruebas y Producción.

### ManagementContext

Proyección editable única por aplicación y ambiente.

| Campo               | Tipo                | Regla                                      |
| ------------------- | ------------------- | ------------------------------------------ |
| `technicalContact`  | `TechnicalContact?` | Datos mínimos del contacto operativo.      |
| `requestOrTicketId` | `string?`           | Se recorta; vacío se normaliza a ausencia. |
| `updatedAt`         | `Instant?`          | Lo determina el servicio.                  |

`TechnicalContact` contiene `name`, `email?` y `phone?`; al menos un canal debe
existir cuando se guarda un contacto. El motivo de una operación crítica no se
guarda aquí: forma parte del comando y de su auditoría.

### Credential

Identidad de acceso de una aplicación. `clientSecret` no existe en el modelo
móvil, ni siquiera como campo opcional o enmascarado.

| Campo            | Tipo                  | Regla                                                |
| ---------------- | --------------------- | ---------------------------------------------------- |
| `id`             | `EntityId`            | Obligatorio.                                         |
| `applicationId`  | `EntityId`            | Debe coincidir con la aplicación consultada.         |
| `environment`    | `Environment`         | Debe coincidir con aplicación y ruta.                |
| `clientId`       | `string`              | Visible, no vacío.                                   |
| `currentVersion` | `CredentialVersion`   | Versión más reciente confirmada.                     |
| `versions`       | `CredentialVersion[]` | Secuencia sin duplicados; histórico de solo lectura. |
| `lastChangedAt`  | `Instant`             | Marca del servidor.                                  |

Existe como máximo una versión utilizable por aplicación y ambiente.

### CredentialVersion

Versión creada por una emisión o regeneración.

| Campo               | Tipo              | Regla                                    |
| ------------------- | ----------------- | ---------------------------------------- |
| `id`                | `EntityId`        | Obligatorio.                             |
| `credentialId`      | `EntityId`        | Pertenece a una credencial.              |
| `sequence`          | `integer`         | Mayor que cero y creciente.              |
| `previousVersionId` | `EntityId?`       | Ausente en la emisión inicial.           |
| `state`             | `CredentialState` | Una de las cuatro variantes persistidas. |
| `createdAt`         | `Instant`         | Marca del servidor.                      |
| `stateChangedAt`    | `Instant`         | Igual o posterior a `createdAt`.         |

Una regeneración exitosa crea la siguiente secuencia activa y cambia la previa
a `rotated_inactive` en la misma operación remota.

### CredentialStateChange

Proyección visible del historial de estados.

| Campo              | Tipo                     | Regla                                                 |
| ------------------ | ------------------------ | ----------------------------------------------------- |
| `fromState`        | `CredentialDisplayState` | Estado confirmado anterior.                           |
| `toState`          | `CredentialState`        | Estado confirmado nuevo.                              |
| `changedAt`        | `Instant`                | Marca del servidor.                                   |
| `reason`           | `string?`                | Obligatorio en suspensión, reactivación y revocación. |
| `actorDisplayName` | `string?`                | Solo para presentación autorizada.                    |

No sustituye a `AuditEvent`, que conserva más evidencia y es inmutable.

### ProtectedDelivery

Resultado efímero de emisión, regeneración o nueva entrega.

| Campo                 | Tipo               | Regla                                                    |
| --------------------- | ------------------ | -------------------------------------------------------- |
| `deliveryId`          | `EntityId`         | Obligatorio.                                             |
| `credentialVersionId` | `EntityId`         | Versión entregada.                                       |
| `deliveryUrl`         | `string` URI HTTPS | Site externo; nunca contiene el OTP.                     |
| `otp`                 | `string`           | No vacío; no se impone longitud no especificada.         |
| `otpExpiresAt`        | `Instant`          | Exactamente dos minutos desde la emisión según servidor. |
| `createdAt`           | `Instant`          | Marca del servidor.                                      |

Solo existe en memoria. El ZIP, su contenido y contraseña no forman parte del
contrato móvil. Al caducar se limpia la entidad y el portapapeles.

### AuditEvent

Evidencia inmutable creada por el servicio.

| Campo              | Tipo              | Regla                                            |
| ------------------ | ----------------- | ------------------------------------------------ |
| `id`               | `EntityId`        | Obligatorio.                                     |
| `occurredAt`       | `Instant`         | Marca del servidor.                              |
| `actorUserId`      | `EntityId`        | Actor autenticado por el servicio.               |
| `actorDisplayName` | `string`          | Presentación autorizada.                         |
| `operation`        | `AuditOperation`  | Acceso, consulta o cambio definido por contrato. |
| `environment`      | `Environment?`    | Obligatorio para operaciones ambientales.        |
| `institutionId`    | `EntityId?`       | Según objetivo.                                  |
| `applicationId`    | `EntityId?`       | Según objetivo.                                  |
| `credentialId`     | `EntityId?`       | Según objetivo.                                  |
| `result`           | `OperationResult` | Exitoso, fallido o rechazado.                    |
| `originIp`         | `string`          | La deriva el servicio; IPv4/IPv6 válida.         |
| `failureCause`     | `string?`         | Mensaje seguro, sin detalle interno ni secreto.  |
| `requestId`        | `string`          | Correlación con cliente/servicio.                |

El cliente nunca envía como fiables actor, IP, hora o resultado. La retención de
cinco años pertenece al servicio.

### UsageSummary

Proyección opcional de solo lectura.

| Campo              | Tipo                                  | Regla                                    |
| ------------------ | ------------------------------------- | ---------------------------------------- |
| `applicationId`    | `EntityId`                            | Coincide con la aplicación consultada.   |
| `environment`      | `Environment`                         | Coincide con la ruta.                    |
| `availability`     | `available \| no_data \| unavailable` | Distingue vacío de fallo de dependencia. |
| `messagesSent`     | `integer?`                            | Cero o mayor cuando está disponible.     |
| `consumedServices` | `string[]`                            | Sin duplicados.                          |
| `usedIps`          | `string[]`                            | IPv4/IPv6 válidas.                       |
| `lastConsumedAt`   | `Instant?`                            | Ausente si no hay consumo.               |

El móvil no agrega ni persiste esta información.

### OperationReceipt

Resultado autoritativo de un comando crítico.

| Campo          | Tipo                  | Regla                                        |
| -------------- | --------------------- | -------------------------------------------- |
| `operationId`  | `EntityId`            | Identifica la ejecución/deduplicación.       |
| `requestId`    | `string`              | Correlación técnica.                         |
| `operation`    | `CredentialOperation` | Emisión, regeneración, entrega o transición. |
| `result`       | `OperationResult`     | Resultado del servicio.                      |
| `occurredAt`   | `Instant`             | Marca del servicio.                          |
| `credential`   | `Credential`          | Último estado confirmado.                    |
| `auditEventId` | `EntityId`            | Evidencia asociada.                          |
| `delivery`     | `ProtectedDelivery?`  | Solo en emisión, regeneración y entrega.     |

No se crea un recibo exitoso de forma optimista.

### Page\<T\>

Proyección común para inventario, auditoría y usuarios.

| Campo          | Tipo       | Regla                                       |
| -------------- | ---------- | ------------------------------------------- |
| `items`        | `T[]`      | Puede estar vacío.                          |
| `page`         | `integer`  | Uno o mayor.                                |
| `pageSize`     | `integer`  | Entre 1 y 100.                              |
| `totalItems`   | `integer`  | Cero o mayor.                               |
| `totalPages`   | `integer`  | Cero o mayor; coherente con total y tamaño. |
| `auditEventId` | `EntityId` | Auditoría de la consulta sensible.          |

## Relaciones

```text
Institution 1 ───── N IntegratedApplication N ───── 1 ApiRole
IntegratedApplication 1 ───── 0..1 Credential
Credential 1 ───── N CredentialVersion
CredentialVersion 0..1 ───── 1 CredentialVersion previa
CredentialVersion 1 ───── N ProtectedDelivery efímera
IntegratedApplication 1 ───── 1 ManagementContext
IntegratedApplication 1 ───── 0..1 UsageSummary
AuthenticatedUser 1 ───── N AuditEvent
IntegratedApplication 1 ───── N AuditEvent
Credential 1 ───── N AuditEvent
```

## Máquina de estados de credencial

```text
no_credentials ── emitir ───────────────▶ active
active ────────── suspender ────────────▶ suspended
suspended ─────── reactivar ────────────▶ active
active ────────── regenerar ────────────▶ rotated_inactive (versión anterior)
                                          + active (versión nueva)
active ────────── revocar ──────────────▶ revoked
suspended ─────── revocar ──────────────▶ revoked
active ────────── nueva entrega ────────▶ active (sin cambio de estado)
```

`rotated_inactive` y `revoked` son terminales para esa versión. La especificación
no autoriza una nueva emisión después de una revocación; esa capacidad requiere
un cambio funcional futuro.

## Reglas de transición

| Operación     | Precondición local                                    | Resultado remoto válido                                             | Fallo/rechazo                                              |
| ------------- | ----------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| Emisión       | `no_credentials` y permiso                            | Nueva versión `active` + entrega.                                   | Sigue `no_credentials`; se conserva auditoría del intento. |
| Regeneración  | `active` y permiso                                    | Nueva `active`; anterior `rotated_inactive` atómicamente + entrega. | La versión anterior permanece `active`.                    |
| Suspensión    | `active`, permiso y motivo                            | `suspended`.                                                        | Estado confirmado no cambia.                               |
| Reactivación  | `suspended`, permiso y motivo                         | `active`.                                                           | Estado confirmado no cambia.                               |
| Revocación    | `active` o `suspended`, permiso senior/admin y motivo | `revoked`.                                                          | Estado confirmado no cambia.                               |
| Nueva entrega | `active` y permiso                                    | Nueva entrega; sigue `active`.                                      | Credencial permanece `active`.                             |
| Consumo OTP   | No expirado y no usado                                | Consumido una vez en el site externo.                               | El site rechaza expirado o reutilizado.                    |

La validación local mejora la experiencia; el servicio repite todas las
precondiciones y es la única autoridad.

## Matriz de permisos como política

| Capacidad                          | Analyst | Senior analyst | Administrator | Auditor |
| ---------------------------------- | ------: | -------------: | ------------: | ------: |
| Consultar aplicaciones/detalle/uso |      Sí |             Sí |            Sí |      No |
| Emitir/regenerar/entregar          |      Sí |             Sí |            Sí |      No |
| Suspender/reactivar                |      Sí |             Sí |            Sí |      No |
| Revocar                            |      No |             Sí |            Sí |      No |
| Editar contexto de gestión         |      Sí |             Sí |            Sí |      No |
| Consultar auditoría                |      No |             Sí |            Sí |      Sí |
| Gestionar usuarios                 |      No |             No |            Sí |      No |

La política recibe perfil, permisos remotos, ambiente y estado. Nunca eleva un
permiso que el servicio no haya concedido.

## Estados de pantalla

Las consultas usan una unión discriminada:

```text
idle | loading | loaded(data, lastConfirmedAt) | empty | failed(error, previousData?)
```

Las operaciones usan:

```text
idle | confirming(context) | submitting(context, idempotencyKey)
     | succeeded(receipt) | failed(error, lastConfirmedCredential)
```

Al cambiar ambiente, cerrar sesión o pasar a segundo plano en una pantalla
sensible, el reducer emite `reset`; una respuesta con request sequence anterior
se ignora.

## Invariantes de seguridad

1. Ningún tipo o fixture contiene `clientSecret` o contraseña ZIP.
2. `ProtectedDelivery` no se serializa ni se guarda en SecureStore.
3. El OTP no aparece en rutas, logs, analítica, errores ni snapshots.
4. Todo recurso operativo incluye y valida `environment`.
5. Solo el servicio crea `AuditEvent`, `occurredAt`, `originIp` y resultado.
6. Un DTO con `contractVersion` distinta o enum desconocido se rechaza.
7. Un fallo nunca sustituye el último estado confirmado por un estado supuesto.
