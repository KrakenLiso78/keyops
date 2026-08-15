# Research: Auditoría funcional persistente

## Decisions

### Append-only desde la aplicación

**Decision**: el adaptador ofrece `append` y `list`; no expone actualización o borrado y el PAT no necesita acceso a otros recursos.

**Rationale**: cumple el alcance funcional del MVP con una superficie mínima. Airtable no prueba inmutabilidad frente a administradores ni retención regulatoria, que quedan en la feature 009.

### Finalización transversal

**Decision**: contexto de petición + finalizador común que recibe el resultado de cada handler.

**Rationale**: garantiza estructura uniforme para éxito, fallo y rechazo sin copiar lógica de auditoría en cada pantalla o repositorio.

### Fallo al auditar

**Decision**: una operación auditable no comunica éxito hasta persistir su evento. Los comandos idempotentes conservan/reconcilian el resultado para completar auditoría al reintentar.

**Rationale**: evita una operación exitosa sin rastro y no requiere una cola o servicio adicional. El alcance y volumen del caso de estudio permiten la escritura síncrona.

### Filtrado y orden

**Decision**: filtro por ambiente/fechas y campos selectivos en Airtable; orden final determinista por fecha y `eventId` en Worker.

**Rationale**: aprovecha filtros del proveedor y resuelve empates sin incorporar una base analítica.

## Primary sources

- [Airtable filterByFormula and sort](https://support.airtable.com/articles/1941464361-airtable-web-api-using-filterbyformula-or-sort-parameters)
- [Airtable Web API pagination](https://support.airtable.com/getting-started-with-airtables-web-api)
- [Airtable API limits](https://support.airtable.com/managing-api-call-limits-in-airtable)
