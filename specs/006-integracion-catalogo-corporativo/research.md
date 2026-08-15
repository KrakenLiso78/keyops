# Research: Integración con catálogo corporativo

## Decisions

### Adaptador neutral

**Decision**: definir `CorporateCatalogPort` y un contrato de capacidades independiente del proveedor.

**Rationale**: todavía no se conoce el sistema real. El puerto permite construir autorización, unión, errores y pruebas sin inventar endpoints; el adaptador concreto queda bloqueado por el contrato corporativo.

**Alternatives considered**: asumir un producto concreto crearía una dependencia no confirmada; replicar todo el catálogo en Airtable produciría dos fuentes de verdad.

### Unión bajo demanda

**Decision**: el catálogo aporta identidad/clasificación y Airtable solo contexto operativo enlazado por ID externo y ambiente.

**Rationale**: mantiene los campos corporativos en solo lectura, evita duplicados y conserva las gestiones propias de KeyOps.

### Caché sin fallback

**Decision**: Cloudflare Cache API con TTL máximo de 60 segundos; al expirar, una indisponibilidad produce error controlado.

**Rationale**: reduce llamadas y latencia sin polling, pero no presenta datos demostrativos o indefinidamente obsoletos como vigentes.

### Cambio de datos corporativos

**Decision**: resolver institución y rol en cada lectura no cacheada y detectar contextos huérfanos; KeyOps nunca escribe el catálogo.

**Rationale**: los cambios aparecen al vencer la caché y la corrección permanece en el sistema propietario.

