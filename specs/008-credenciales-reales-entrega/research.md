# Research: Credenciales reales y entrega segura

## Decisions

### Servicios externos autoritativos

**Decision**: credencial y entrega se implementan como dos puertos neutrales; Airtable solo registra metadata no secreta.

**Rationale**: la constitución exige emitir secretos en un servicio de confianza y prohíbe persistirlos en móvil/Airtable. Separar entrega evita que el Worker se convierta en vault.

**Alternatives considered**: generar secretos en Worker aumenta exposición; reutilizar el flujo sintético no prueba aceptación real; guardar ZIP en Airtable incumple seguridad/capacidad.

### Contrato `/v2`

**Decision**: mantener `/v1` sintético y exponer operaciones reales bajo `/v2`.

**Rationale**: evita que un cliente o despliegue ambiguo mezcle efectos sintéticos y reales y permite cambiar receipts/entrega de forma gobernada.

### Idempotencia y reconciliación

**Decision**: clave idempotente + operation ID del proveedor + consulta de estado antes de reintentar.

**Rationale**: una respuesta perdida no debe repetir una emisión/revocación; los servicios distintos no comparten una transacción global.

### Entrega por canales separados

**Decision**: el servicio corporativo produce ZIP cifrado, OTP y contraseña distintos y los entrega por canales aprobados separados.

**Rationale**: reduce la exposición conjunta y mantiene material secreto fuera de Airtable y del modelo persistente del cliente.

