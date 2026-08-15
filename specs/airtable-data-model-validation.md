# Validación transversal de modelos de datos y Airtable

**Alcance**: features activas 002–009  
**Base objetivo**: `appnNMuwzI72qsjyE`  
**Modo**: exclusivamente lectura  
**Fecha de evidencia**: 2026-08-15T17:25:53.504Z

## Criterio de validación

La comprobación consulta el esquema con `GET /v0/meta/bases/{baseId}/tables` y toma como máximo tres registros por cada una de las nueve tablas actuales mediante `GET /v0/{baseId}/{table}`. No muestra valores de campo, no registra el PAT y no ejecuta creación, actualización, borrado ni reset.

El esquema actual se contrasta con los modelos 002–005. Las evoluciones de Airtable definidas por 006–008 se registran como cambios planificados para el siguiente Sprint, no como defectos de la base actual. Las entidades cuyo origen autoritativo será corporativo se marcan como `N/A externo`.

## Matriz 002–009

| Entidad | Fuente autoritativa | Tabla Airtable aplicable | Campos y tipos esperados | Restricciones principales | Feature propietaria | Estado frente a Airtable |
|---|---|---|---|---|---|---|
| Usuario y autorización KeyOps | Airtable | `Users` | ID/login/nombre texto; perfil selección; habilitado checkbox; permisos selección múltiple; fechas date-time | Identificadores únicos; permisos canónicos; sin contraseñas ni tokens | 002; evolución 007 | Tabla legible; 3 muestras con los 7 campos base poblados; tipos sin verificar |
| Sesión KeyOps | Worker | N/A | N/A | Cookie firmada/cifrada; corta duración | 002/007 | N/A externo |
| Institución representativa | Airtable | `Institutions` | IDs/nombre/búsqueda texto | ID único; datos sintéticos | 003 | Tabla legible; 3 muestras con los 3 campos poblados; tipos sin verificar |
| Rol API representativo | Airtable | `ApiRoles` | IDs/nombre texto; servicios selección múltiple | ID único; servicios sintéticos | 003 | Tabla legible; 3 muestras con los 3 campos poblados; tipos sin verificar |
| Aplicación representativa | Airtable | `Applications` | IDs/texto; entorno/estado selección; JSON texto largo; fechas date-time | Referencias válidas; concurrencia por `updatedAt`; sin secretos | 003/004 | Tabla legible; 3 muestras y 12 campos poblados; opcionales y tipos sin verificar |
| Credencial sintética | Airtable | `Credentials` | IDs texto; entorno/estado selección; fecha date-time | Una versión efectiva; estado terminal al revocar | 004 | Tabla legible y vacía; campos y tipos sin verificar |
| Versión sintética | Airtable | `CredentialVersions` | IDs texto; secuencia número; estado selección; motivo texto largo; fechas date-time | Secuencia monótona; transición válida | 004 | Tabla legible y vacía; campos y tipos sin verificar |
| Concesión de entrega sintética | Airtable | `DeliveryGrants` | IDs/digest texto; fechas date-time | Código solo como digest; un uso; dos minutos | 004 | Tabla legible y vacía; campos y tipos sin verificar |
| Idempotencia sintética | Airtable | `IdempotencyRecords` | hashes/ID texto; estado selección; receipt texto largo; expiración date-time | Misma clave y cuerpo, un solo efecto | 004 | Tabla legible y vacía; campos y tipos sin verificar |
| Evento de auditoría funcional | Airtable | `AuditEvents` | IDs/texto; versión número; entorno/resultado selección; fechas date-time | Append-only funcional; redacción de secretos | 005 | Tabla legible y vacía; campos y tipos sin verificar |
| Identidad, institución, rol y aplicación corporativos | Catálogo corporativo | N/A | N/A | IDs corporativos estables; caché máxima 60 s; sin fallback demostrativo | 006 | N/A externo |
| Contexto operativo de aplicación | Airtable | `ApplicationOperationalContexts` (planificada) | IDs texto; entorno selección; contacto/motivo texto largo; fechas date-time | Enlace por ID corporativo y entorno; sin autoridad de catálogo | 006 | Cambio planificado |
| Identidad autenticada | Proveedor OIDC corporativo | N/A | N/A | issuer/audience/nonce/redirect URI; estado activo ≤5 min | 007 | N/A externo |
| Perfil y autorización KeyOps corporativa | Airtable | `Users` (evolución planificada) | issuer URL/texto; subject texto; validación/actualización date-time | `(issuer, subject)` único; mínimo privilegio | 007 | Cambio planificado |
| Credencial y versión reales | Servicio corporativo de credenciales | N/A | N/A | Sin secreto en KeyOps; estado confirmado por proveedor | 008 | N/A externo |
| Entrega real ZIP/OTP | Servicio corporativo de entrega | N/A | N/A | OTP un uso/dos minutos; contraseña distinta; no persistencia en Airtable | 008 | N/A externo |
| Referencia de credencial real | Airtable | `RealCredentialReferences` (planificada) | referencias texto; entorno/estado selección; fechas date-time | IDs opacos; sin Client Secret | 008 | Cambio planificado |
| Receipt de operación real | Airtable | `RealOperationReceipts` (planificada) | correlaciones texto; acción/resultado selección; fechas date-time | Idempotencia; sin URL, contraseña ni OTP | 008 | Cambio planificado |
| Evento y evidencia de cumplimiento | Almacén corporativo WORM | N/A | N/A | Inmutable; integridad verificable; retención bloqueada cinco años | 009 | N/A externo |
| Auditoría funcional de caso de estudio | Airtable | `AuditEvents` | Proyección definida por 005 | No demuestra cumplimiento WORM | 009 | Tabla legible y vacía; no demuestra WORM |

## Resultado de la comprobación real

La comprobación de registros se ejecutó contra la base objetivo en modo de solo lectura:

- Los nueve endpoints de tabla esperados respondieron correctamente.
- `Users`, `Institutions`, `ApiRoles` y `Applications` devolvieron tres muestras cada uno. Solo se conservaron el recuento y los nombres de campos poblados; no se copiaron valores.
- `Credentials`, `CredentialVersions`, `DeliveryGrants`, `IdempotencyRecords` y `AuditEvents` respondieron correctamente con cero registros.
- No se observó una diferencia de nombre de tabla ni de campo poblado en las muestras disponibles.
- El endpoint de metadatos devolvió `403 INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND`. Por ello no se pudieron verificar tipos, campos vacíos/opcionales, el número total de tablas ni tablas inesperadas.

**Resultado global**: `PARCIAL — bloqueado por scope`. El PAT necesita acceso a la base y `schema.bases:read`; ya dispone de lectura de registros. Tras corregir el permiso, ejecutar desde `worker/`:

```bash
npm run airtable:models:validate
```

Una ejecución completa deberá informar `schemaValidationStatus: complete`. Hasta entonces, la validación de tipos y restricciones no puede considerarse realizada.

## Tratamiento de diferencias

- Una diferencia en una tabla actual se convierte en una tarea concreta del `tasks.md` de la feature propietaria.
- Una evolución marcada como planificada se implementa en las tareas 006–008 y no se crea automáticamente en Airtable durante esta validación.
- No se modifica la base desde este proceso.
- El bloqueo de permisos no constituye una diferencia del modelo y no genera una tarea de implementación; requiere corregir el scope del PAT y repetir la validación.

## Limitaciones

- Airtable solo prueba persistencia funcional del caso de estudio; no valida catálogo, OIDC, credenciales reales, entrega segura ni WORM.
- Los proveedores y entornos corporativos siguen siendo checkpoints externos obligatorios antes del piloto.
- La presencia y el tipo de un campo no demuestran por sí solos unicidad, inmutabilidad, retención ni seguridad del proveedor.
- Los campos opcionales no aparecen en muestras cuando están vacíos; solo el endpoint de metadatos puede confirmar su existencia y tipo.
