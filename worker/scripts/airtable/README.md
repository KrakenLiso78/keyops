# Reset de la base KeyOps en Airtable

Este proceso vacía las nueve tablas sintéticas de KeyOps y reconstruye el estado inicial a partir del
seed canónico de `mobile/src/data/fake/seed.ts`. No duplica los datos semilla en otro fichero.
Restablece registros, no la estructura: no recrea tablas, campos, vistas ni opciones de selección
que alguien haya modificado manualmente.

## Estado inicial

| Tabla                | Registros después del reset |
| -------------------- | --------------------------: |
| `Users`              |                           4 |
| `Institutions`       |                          24 |
| `ApiRoles`           |                           4 |
| `Applications`       |                          24 |
| `Credentials`        |                           0 |
| `CredentialVersions` |                           0 |
| `DeliveryGrants`     |                           0 |
| `IdempotencyRecords` |                           0 |
| `AuditEvents`        |                           0 |

El seed móvil no tenía registros relacionales de credenciales, entregas, idempotencia o
auditoría. Esas tablas se vacían para recuperar el estado inicial, pero no se inventan datos.
Los campos exclusivos del fake móvil sin columna equivalente en Airtable —por ejemplo uso e
historial embebido— tampoco se persisten.

## Configuración local

1. Crea `worker/.env` local sin añadirlo a Git.
2. Completa `AIRTABLE_TOKEN` con un PAT restringido a la base KeyOps. Las pruebas requieren
   `data.records:read` y `data.records:write`; la validación requiere `schema.bases:read`; y la
   migración aditiva requiere además `schema.bases:write`.
3. No compartas ni añadas `worker/.env` a Git.

## Migración aditiva de esquema 2026-08-20

La validación completa detecta tablas y campos documentados que todavía no existen en la base.
Esta migración solo añade estructura; no cambia tipos, no elimina estructura y no toca registros.

```bash
npm run airtable:schema:check
npm run airtable:schema:migrate
npm run airtable:models:validate
```

El primer comando es de solo lectura. La migración es idempotente, crea las tablas de las features
006 y 008 y exige la confirmación literal incluida en el script de npm.

## Validar el seed sin tocar Airtable

```bash
cd worker
npm run airtable:seed:check
```

## Ejecutar el reset destructivo

```bash
cd worker
npm run airtable:reset -- --confirm-reset=KeyOps
```

La confirmación literal evita una ejecución accidental. El proceso:

1. comprueba el acceso a las nueve tablas y captura todos sus registros;
2. borra en orden de dependencias, en lotes de hasta diez;
3. crea usuarios, instituciones, roles y aplicaciones, también en lotes de diez;
4. relee las nueve tablas y compara los recuentos esperados.

Airtable no ofrece una transacción global entre tablas. Si hay un fallo intermedio, vuelve a
ejecutar el mismo comando: primero vaciará el estado parcial y después reconstruirá el seed.

## Delta `ApplicationOperationalContexts`

Esta integración añade una tabla que conserva únicamente metadatos operativos
de KeyOps; no copia nombres corporativos, instituciones o roles.

| Campo                   | Tipo         | Regla                                                  |
| ----------------------- | ------------ | ------------------------------------------------------ |
| `contextId`             | texto        | Identificador KeyOps único                             |
| `catalogApplicationId`  | texto        | ID corporativo estable                                 |
| `environment`           | selección    | `test` o `production`; forma la clave lógica con el ID |
| `technicalContact`      | texto largo  | JSON allowlist opcional                                |
| `managementReason`      | texto largo  | Opcional, máximo 500 caracteres                        |
| `requestOrTicketId`     | texto        | Opcional, máximo 100 caracteres                        |
| `credentialReferenceId` | texto        | Referencia opcional no secreta                         |
| `declaredIps`           | texto largo  | Array JSON de IPs operativas                           |
| `updatedAt`             | fecha y hora | Token de concurrencia generado por el Worker           |

El Worker puede listar, crear y actualizar esta tabla. Nunca escribe en el
catálogo corporativo y rechaza claves `(catalogApplicationId, environment)`
duplicadas.

## Delta corporativo de `Users`

La tabla `Users` conserva autorización KeyOps, no credenciales ni claims OIDC.

| Campo                 | Tipo         | Regla                                               |
| --------------------- | ------------ | --------------------------------------------------- |
| `corporateIssuer`     | URL/texto    | Issuer HTTPS exacto                                 |
| `corporateSubject`    | texto        | Identificador estable; único junto al issuer        |
| `identityValidatedAt` | fecha y hora | Última validación corporativa, máximo cinco minutos |
| `updatedAt`           | fecha y hora | Token de concurrencia de la autorización            |

`loginIdentifier` y `displayName` son atributos visibles, no claves de identidad.
La aplicación rechaza duplicados de `(corporateIssuer, corporateSubject)`.

## Delta de credenciales reales `/v2`

Las tablas siguientes guardan exclusivamente proyecciones y correlaciones no
secretas. No contienen Client Secret, ZIP, contraseña, OTP ni URL de descarga.

### `RealCredentialReferences`

| Campo                           | Tipo         | Regla                                                        |
| ------------------------------- | ------------ | ------------------------------------------------------------ |
| `referenceId`                   | texto        | ID estable mostrado por KeyOps                               |
| `externalCredentialId`          | texto        | Referencia opaca del proveedor                               |
| `catalogApplicationId`          | texto        | Aplicación corporativa de la feature 006                     |
| `environment`                   | selección    | `test` o `production`                                        |
| `externalVersionId`             | texto        | Última versión confirmada                                    |
| `effectiveState`                | selección    | `active`, `suspended`, `revoked` o `reconciliation_required` |
| `lastOperationId`               | texto        | Correlación opaca del proveedor                              |
| `lastConfirmedAt` / `updatedAt` | fecha y hora | Confirmación y token de concurrencia                         |
| `sealedDeliveryHandle`          | texto        | Handle opaco; nunca material de entrega                      |
| `schemaVersion`                 | texto        | Siempre `2`                                                  |

La clave lógica es `(catalogApplicationId, environment)` y solo puede existir una
referencia por aplicación y ambiente.

### `RealOperationReceipts`

| Campo                                                  | Tipo            | Regla                                                  |
| ------------------------------------------------------ | --------------- | ------------------------------------------------------ |
| `operationId` / `providerOperationId`                  | texto           | Correlaciones KeyOps y proveedor                       |
| `idempotencyScopeHash` / `requestFingerprint`          | texto           | SHA-256; nunca cuerpo o clave en claro                 |
| `requestId` / `actorUserId`                            | texto           | Correlación HTTP inicial y propietario de la operación |
| `catalogApplicationId` / `environment` / `referenceId` | texto/selección | Contexto no secreto                                    |
| `action`                                               | selección       | `issue`, `rotate`, `suspend`, `reactivate` o `revoke`  |
| `status`                                               | selección       | `pending`, `confirmed` o `reconciliation_required`     |
| `result`                                               | selección       | `pending`, `succeeded`, `failed` o `rejected`          |
| `deliveryReferenceId` / `deliveryExpiresAt`            | texto/fecha     | Referencia segura opcional                             |
| `auditEventId` / `failureCode`                         | texto           | Evidencia y causa controlada                           |
| `createdAt` / `confirmedAt` / `updatedAt`              | fecha y hora    | Ciclo de vida                                          |
| `schemaVersion`                                        | texto           | Siempre `2`                                            |
