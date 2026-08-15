# Reset de la base KeyOps en Airtable

Este proceso vacía las nueve tablas de KeyOps y reconstruye el estado inicial a partir del
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

1. Copia `worker/.env.example` a `worker/.env`.
2. Completa `AIRTABLE_TOKEN` con un PAT restringido a la base KeyOps y los scopes
   `data.records:read` y `data.records:write`.
3. No compartas ni añadas `worker/.env` a Git.

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
