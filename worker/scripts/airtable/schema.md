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

No se crean campos para Client Secret, OTP, contraseñas ni enlaces de entrega. La base completa conserva menos de 1.000 registros según el presupuesto del plan.
