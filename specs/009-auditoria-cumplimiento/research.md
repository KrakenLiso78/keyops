# Research: Auditoría de cumplimiento y retención

## Decisions

### Almacén WORM autoritativo

**Decision**: usar un servicio corporativo existente con write-once/retention lock como única evidencia de cumplimiento.

**Rationale**: Airtable append-only desde la aplicación no impide cambios administrativos ni acredita cinco años. El proveedor concreto queda sujeto al checkpoint de Compliance.

**Alternatives considered**: hashes en Airtable detectan algunos cambios pero no impiden borrado; una copia local/Worker no ofrece durabilidad; un SIEM completo amplía alcance.

### Append síncrono e idempotente

**Decision**: event ID estable, acuse persistente y reconciliación antes de afirmar éxito auditable.

**Rationale**: evita huecos y duplicados sin añadir una cola nueva. Las operaciones reales ya efectivas se recuperan por operation ID y no se repiten.

### Versionado legible

**Decision**: `schemaVersion`, contrato canónico y upcasters de lectura conservados junto a fixtures.

**Rationale**: los eventos deben seguir interpretables durante cinco años sin reescribir evidencia bloqueada.

### Evidencia de retención y recuperación

**Decision**: combinar configuración exportada/atestada, pruebas de alteración, muestra histórica versionada y recovery drill.

**Rationale**: esperar cinco años no es una prueba ejecutable; una fecha simulada tampoco demuestra que la política del proveedor esté bloqueada.

