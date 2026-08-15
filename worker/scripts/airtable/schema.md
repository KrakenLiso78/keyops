# Esquema Airtable — datos representativos

Las identidades funcionales son los campos terminados en `Id`; los IDs `rec...` de Airtable no se exponen. Todos los nombres de tabla y campo distinguen mayúsculas.

## Institutions

| Campo           | Tipo Airtable    | Regla                                |
| --------------- | ---------------- | ------------------------------------ |
| `institutionId` | Single line text | Único y estable                      |
| `name`          | Single line text | Obligatorio, sintético o anonimizado |
| `searchName`    | Single line text | Nombre normalizado sin acentos       |

## ApiRoles

| Campo                | Tipo Airtable    | Regla                     |
| -------------------- | ---------------- | ------------------------- |
| `roleId`             | Single line text | Único y estable           |
| `name`               | Single line text | Obligatorio               |
| `serviceIdentifiers` | Multiple select  | Solo servicios sintéticos |

## Applications

| Campo                 | Tipo Airtable    | Regla                                               |
| --------------------- | ---------------- | --------------------------------------------------- |
| `applicationId`       | Single line text | Único en ambos ambientes                            |
| `name`                | Single line text | Obligatorio                                         |
| `searchName`          | Single line text | Nombre normalizado sin acentos                      |
| `institutionId`       | Single line text | Referencia funcional a `Institutions`               |
| `environment`         | Single select    | `test` o `production`                               |
| `roleId`              | Single line text | Referencia funcional a `ApiRoles`                   |
| `declaredIps`         | Long text        | Array JSON de cadenas                               |
| `technicalContact`    | Long text        | Objeto JSON allowlist `{displayName,email?,phone?}` |
| `managementReason`    | Long text        | Opcional, máximo 500 caracteres                     |
| `requestOrTicketId`   | Single line text | Opcional, máximo 100 caracteres                     |
| `credentialState`     | Single select    | Estado canónico de credencial                       |
| `currentCredentialId` | Single line text | Opcional; lo mantiene la feature 004                |
| `lastChangedAt`       | Date/time        | ISO 8601 generado por servidor                      |
| `updatedAt`           | Date/time        | Versión para control optimista                      |

## Credentials

| Campo               | Tipo Airtable    | Regla                                   |
| ------------------- | ---------------- | --------------------------------------- |
| `credentialId`      | Single line text | Único y estable                         |
| `applicationId`     | Single line text | Referencia funcional a `Applications`   |
| `environment`       | Single select    | `test` o `production`; inmutable        |
| `syntheticClientId` | Single line text | Identificador inequívocamente sintético |
| `currentVersionId`  | Single line text | Referencia a la única versión vigente   |
| `state`             | Single select    | `active`, `suspended` o `revoked`       |
| `operationId`       | Single line text | Correlación de creación y recuperación  |
| `lastChangedAt`     | Date/time        | ISO 8601 generado por servidor          |
| `schemaVersion`     | Single line text | Versión de registro; valor inicial `1`  |

## CredentialVersions

| Campo               | Tipo Airtable    | Regla                                                            |
| ------------------- | ---------------- | ---------------------------------------------------------------- |
| `versionId`         | Single line text | Único y estable                                                  |
| `credentialId`      | Single line text | Referencia funcional a `Credentials`                             |
| `sequence`          | Number           | Entero creciente por credencial                                  |
| `previousVersionId` | Single line text | Vacío para la primera versión                                    |
| `state`             | Single select    | `pending`, `active`, `suspended`, `rotated_inactive` o `revoked` |
| `operationId`       | Single line text | Correlación de operación y reconciliación                        |
| `reason`            | Long text        | Motivo requerido en suspensión, reactivación y revocación        |
| `createdAt`         | Date/time        | ISO 8601 generado por servidor                                   |
| `stateChangedAt`    | Date/time        | Última transición confirmada                                     |
| `schemaVersion`     | Single line text | Versión de registro; valor inicial `1`                           |

## DeliveryGrants

| Campo                 | Tipo Airtable    | Regla                                          |
| --------------------- | ---------------- | ---------------------------------------------- |
| `deliveryId`          | Single line text | Único y estable                                |
| `credentialVersionId` | Single line text | Referencia funcional a `CredentialVersions`    |
| `applicationId`       | Single line text | Alcance para autorización y artefacto          |
| `environment`         | Single select    | `test` o `production`                          |
| `codeDigest`          | Single line text | HMAC; nunca código en claro                    |
| `expiresAt`           | Date/time        | Exactamente dos minutos después de la creación |
| `consumedAt`          | Date/time        | Vacío hasta el consumo                         |
| `invalidatedAt`       | Date/time        | Vacío mientras el grant sea vigente            |
| `operationId`         | Single line text | Correlación de operación                       |
| `createdAt`           | Date/time        | ISO 8601 generado por servidor                 |
| `schemaVersion`       | Single line text | Versión de registro; valor inicial `1`         |

## IdempotencyRecords

| Campo                | Tipo Airtable    | Regla                                           |
| -------------------- | ---------------- | ----------------------------------------------- |
| `scopeKey`           | Single line text | Hash único de usuario, ambiente y clave         |
| `requestFingerprint` | Single line text | Hash de operación, recurso y cuerpo normalizado |
| `operationId`        | Single line text | Identificador estable de la operación           |
| `status`             | Single select    | `processing`, `committed` o `failed`            |
| `receiptJson`        | Long text        | Receipt seguro; nunca contiene OTP              |
| `failureCode`        | Single line text | Código controlado si la operación falla         |
| `expiresAt`          | Date/time        | Límite de limpieza del registro                 |
| `createdAt`          | Date/time        | ISO 8601 generado por servidor                  |
| `updatedAt`          | Date/time        | Último cambio de estado                         |
| `schemaVersion`      | Single line text | Versión de registro; valor inicial `1`          |

No se crean campos para Client Secret, OTP en claro, contraseñas ni enlaces de entrega. La base completa conserva menos de 1.000 registros según el presupuesto del plan.
