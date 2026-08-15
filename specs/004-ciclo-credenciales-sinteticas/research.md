# Research: Ciclo de vida de credenciales sintéticas

## Decisions

### Idempotencia persistente

**Decision**: registro `IdempotencyRecords` por usuario, ambiente y clave, con huella del comando y receipt final.

**Rationale**: los reintentos deben sobrevivir a otra instancia del Worker. Una caché en memoria no ofrece esa garantía y repetir ciegamente una escritura puede duplicar versiones.

### Operaciones recuperables sobre Airtable

**Decision**: protocolo `processing → committed/failed`, identificador de operación en cada registro y reconciliación antes de responder a un reintento.

**Rationale**: Airtable admite lotes pero no se asume una transacción relacional multi-paso. El estado pendiente hace visible y reparable una respuesta incierta sin comunicar éxito prematuro.

### Código de un solo uso

**Decision**: generar con Web Crypto y devolver una vez; persistir solo HMAC/digest, expiración y consumo.

**Rationale**: permite validar uso único entre invocaciones sin persistir el OTP en claro. El material es sintético y el pepper permanece como Worker Secret.

### Artefacto sintético

**Decision**: documento JSON/texto pequeño generado por el Worker y etiquetado como no funcional.

**Rationale**: prueba entrega/descarga sin ZIP, almacenamiento de ficheros ni credenciales reales, todos fuera del MVP.

## Primary sources

- [Cloudflare Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [Cloudflare Workers Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Airtable API limits and batching](https://support.airtable.com/managing-api-call-limits-in-airtable)
