# Research: Publicación web móvil y acceso por perfil

## Decisions

### Un solo despliegue para web y API

**Decision**: Cloudflare Workers sirve la exportación `mobile/dist` y ejecuta las rutas `/v1/*` en el mismo despliegue.

**Rationale**: reduce configuración, evita un segundo proveedor y elimina CORS en el recorrido normal. Cloudflare documenta activos estáticos, fallback SPA y rutas que ejecutan primero el Worker.

**Alternatives considered**: Pages más Worker separado añade dos despliegues; túnel local no es una publicación estable; un servidor Node persistente supera la necesidad del caso de estudio.

### Sesión de demostración remota

**Decision**: credenciales predefinidas como secretos del Worker, usuarios/perfiles persistentes en Airtable y token breve firmado con Web Crypto.

**Rationale**: Airtable no almacena contraseñas; deshabilitar un usuario surte efecto al restaurar la sesión; no se añade un proveedor de identidad antes de la feature 007.

**Alternatives considered**: credenciales en el bundle incumplen seguridad; OAuth corporativo amplía alcance; sesiones opacas persistidas consumirían registros y escrituras sin aportar valor al MVP.

### Configuración remota por defecto

**Decision**: `EXPO_PUBLIC_DATA_SOURCE=remote` es el modo de demo y release. `fake` requiere selección explícita y no puede activarse como fallback ante errores.

**Rationale**: evita falsos positivos de persistencia y mantiene el fake útil para pruebas rápidas.

### Gestión de secretos

**Decision**: `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, credenciales demo y `SESSION_SIGNING_KEY` se configuran mediante Workers Secrets; solo la URL pública de API puede usar `EXPO_PUBLIC_*`.

**Rationale**: Cloudflare diferencia secretos cifrados de variables de texto, y Airtable PAT permite limitar scopes y base.

## Primary sources

- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Airtable personal access tokens](https://support.airtable.com/docs/creating-personal-access-tokens)
- [Airtable API limits](https://support.airtable.com/managing-api-call-limits-in-airtable)
