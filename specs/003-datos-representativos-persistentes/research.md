# Research: Datos representativos persistentes

## Decisions

### Modelo pequeño y normalizado

**Decision**: tres tablas (`Institutions`, `ApiRoles`, `Applications`) con identificadores de negocio estables y referencias lógicas.

**Rationale**: evita duplicación importante sin convertir Airtable en un catálogo corporativo. El contexto de gestión vive en `Applications`, porque solo tiene un propietario y una versión vigente.

### Búsqueda en el Worker

**Decision**: filtrar siempre por ambiente en Airtable; para el pequeño conjunto del MVP, normalizar y buscar campos autorizados en el Worker, paginando la API de Airtable hasta completar la consulta.

**Rationale**: soporta búsqueda sin acentos de forma determinista y evita fórmulas complejas o un servicio de búsqueda. Airtable pagina hasta 100 registros y permite filtro/orden servidor.

### Caché e invalidación

**Decision**: Cache API con TTL corto para listas/detalles no sensibles; invalidación explícita tras actualizar gestión.

**Rationale**: reduce cuota sin polling ni estado local autoritativo. Un error de Airtable nunca se sustituye por el fake.

### Concurrencia

**Decision**: control optimista con `updatedAt`/`If-Match` y respuesta `409`.

**Rationale**: evita pérdidas silenciosas con una sola lectura y escritura y sin introducir bloqueos distribuidos.

## Primary sources

- [Airtable Web API getting started and pagination](https://support.airtable.com/getting-started-with-airtables-web-api)
- [Airtable filterByFormula and sort](https://support.airtable.com/articles/1941464361-airtable-web-api-using-filterbyformula-or-sort-parameters)
- [Airtable API limits](https://support.airtable.com/managing-api-call-limits-in-airtable)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
