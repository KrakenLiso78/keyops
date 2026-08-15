# Feature Specification: Consulta de consumo de aplicaciones

**Feature Branch**: `[010-consumo-aplicaciones]`

**Created**: 2026-08-15

**Status**: Futuro — no bloquea el MVP ni el piloto inicial

**Input**: Separación de US-11 de la especificación paraguas de KeyOps.

## User Scenarios & Testing

### US-USE-01 — Consultar el consumo disponible (Priority: P2)

Como analista, quiero consultar mensajes, servicios, IP y último consumo para investigar incidencias con contexto operativo.

**Independent Test**: Se prueba una aplicación con consumo, otra sin registros y otra cuya fuente de consumo no está disponible.

**Acceptance Scenarios**:

```gherkin
Escenario: Consumo disponible
  Dado que existen registros autorizados de consumo para una aplicación
  Cuando el analista consulta su uso
  Entonces ve mensajes enviados, servicios consumidos, IP utilizadas y fecha del último consumo

Escenario: Consumo ausente o no disponible
  Dado que no existen registros o la fuente no está disponible
  Cuando el analista consulta el uso
  Entonces el sistema distingue entre ausencia de consumo e indisponibilidad temporal
```

### Edge Cases

- Registros de consumo retrasados o incompletos.
- IP duplicadas o datos procedentes de varios ambientes.
- Usuario sin permiso sobre la aplicación solicitada.

## Requirements

### Functional Requirements

- **FR-USE-001**: La consulta DEBE limitarse al ambiente activo y a aplicaciones autorizadas.
- **FR-USE-002**: El sistema DEBE mostrar mensajes enviados, servicios, IP y último consumo disponibles.
- **FR-USE-003**: La ausencia de consumo DEBE distinguirse de una indisponibilidad de la fuente.
- **FR-USE-004**: La feature NO DEBE mostrar Client Secrets ni otros materiales de entrega.
- **FR-USE-005**: La consulta DEBE quedar auditada cuando la política aplicable la considere sensible.

### Key Entities

- **Registro de consumo**: Evidencia de uso de una aplicación en un ambiente.
- **Servicio consumido**: Capacidad de API utilizada por la aplicación.
- **Último consumo**: Marca temporal más reciente disponible.

## Success Criteria

### Measurable Outcomes

- **SC-USE-001**: El 100 % de las consultas devuelve solo consumo del ambiente y aplicación autorizados.
- **SC-USE-002**: El sistema distingue correctamente ausencia e indisponibilidad en todos los casos de prueba.
- **SC-USE-003**: Se detectan cero secretos en los datos de consumo mostrados.
- **SC-USE-004**: El 95 % de las consultas disponibles muestra resultados en menos de dos segundos durante la validación acordada.

## Assumptions

- Existirá una fuente autorizada de datos de consumo antes de planificar esta feature.
- El ciclo de vida de credenciales puede operar sin esta información.

## Out of Scope

- Monitorización en tiempo real, alertas y analítica avanzada.
- Modificación de datos de consumo.
- Bloqueo automático de credenciales por patrones de uso.
