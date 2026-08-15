# Feature Specification: Datos representativos persistentes

**Feature Branch**: `[003-datos-representativos-persistentes]`

**Created**: 2026-08-15

**Status**: Definida para el Sprint MVP web

**Input**: Separación de US-02, US-03 y US-10 de la especificación paraguas de KeyOps.

## User Scenarios & Testing

### US-DATA-01 — Localizar aplicaciones y credenciales (Priority: P1)

Como analista, quiero consultar, buscar, filtrar y ordenar un inventario representativo para localizar la integración que debo gestionar.

**Independent Test**: Con al menos 20 aplicaciones repartidas entre ambientes y estados se validan paginación, búsqueda autorizada, filtros, ordenación y ausencia de resultados.

**Acceptance Scenarios**:

```gherkin
Escenario: Buscar en el inventario persistente
  Dado que existen aplicaciones representativas en el ambiente activo
  Cuando el analista busca por un campo operativo autorizado
  Entonces obtiene solo los registros coincidentes del ambiente activo
  Y el resultado no incluye secretos ni datos de entrega

Escenario: Consulta sin coincidencias
  Dado que no existe ningún registro coincidente
  Cuando el analista aplica una búsqueda o filtro
  Entonces el sistema informa que no hay resultados
  Y conserva los criterios introducidos
```

### US-DATA-02 — Consultar el detalle de una aplicación (Priority: P1)

Como analista, quiero consultar el detalle persistente de una aplicación para comprobar su contexto antes de actuar.

**Independent Test**: Se consulta una aplicación existente, una inexistente y otra con historial; nunca se muestra un Client Secret.

**Acceptance Scenarios**:

```gherkin
Escenario: Detalle existente
  Dado que la aplicación existe y el analista está autorizado
  Cuando abre su detalle
  Entonces ve institución, aplicación, ambiente, rol, contacto, IP declaradas, solicitud, Client ID e historial
  Y no ve ningún Client Secret
```

### US-DATA-03 — Conservar el contexto de gestión (Priority: P2)

Como analista, quiero registrar contacto, motivo y solicitud para que el contexto permanezca disponible en consultas posteriores.

**Independent Test**: Se actualiza una gestión, se cierra la sesión y otro usuario autorizado comprueba el mismo valor.

**Acceptance Scenarios**:

```gherkin
Escenario: Actualización persistente de una gestión
  Dado que el analista consulta una aplicación autorizada
  Cuando actualiza el contacto, motivo o número de solicitud
  Entonces el sistema confirma el cambio
  Y una sesión posterior muestra el mismo valor

Escenario: Fallo al conservar el cambio
  Dado que el analista introduce información válida
  Cuando el sistema no puede conservarla
  Entonces no comunica éxito
  Y mantiene el último valor confirmado
```

### Edge Cases

- Registros duplicados o con identificadores incompletos dentro del conjunto representativo.
- Cambio de ambiente durante una búsqueda activa.
- Actualización concurrente del mismo contexto de gestión.
- Agotamiento temporal de la capacidad de persistencia.

## Requirements

### Functional Requirements

- **FR-DATA-001**: El MVP DEBE disponer de datos representativos persistentes de instituciones, aplicaciones, roles, usuarios e historial suficiente para validar esta feature.
- **FR-DATA-002**: El inventario DEBE estar paginado y limitado al ambiente activo y al alcance del usuario.
- **FR-DATA-003**: La búsqueda DEBE cubrir los campos operativos autorizados definidos en la especificación paraguas e ignorar mayúsculas, minúsculas y acentos.
- **FR-DATA-004**: La búsqueda NO DEBE incluir Client Secrets, códigos, contraseñas ni enlaces de entrega.
- **FR-DATA-005**: El detalle DEBE mostrar el Client ID cuando exista y nunca el Client Secret.
- **FR-DATA-006**: El analista DEBE poder registrar y actualizar contacto, motivo y solicitud o ticket.
- **FR-DATA-007**: Un cambio solo DEBE confirmarse cuando sea persistente.
- **FR-DATA-008**: Los cambios confirmados DEBEN sobrevivir al cierre de la aplicación y a una sesión nueva.
- **FR-DATA-009**: Dos usuarios autorizados para el mismo recurso DEBEN observar el mismo estado confirmado.
- **FR-DATA-010**: La feature NO DEBE depender del catálogo corporativo ni modificar sistemas reales.

### Key Entities

- **Institución representativa**: Organización ficticia o anonimizada que agrupa aplicaciones.
- **Aplicación representativa**: Integración del caso de estudio con ambiente, rol y contexto operativo.
- **Rol de API**: Servicios permitidos a una aplicación, sin conceder permisos reales en el MVP.
- **Gestión**: Contacto, motivo y solicitud asociados a una aplicación.

## Success Criteria

### Measurable Outcomes

- **SC-DATA-001**: Con al menos 20 aplicaciones, el 100 % de las búsquedas de prueba devuelve solo coincidencias autorizadas del ambiente activo.
- **SC-DATA-002**: El 100 % de los cambios confirmados permanece visible tras cerrar e iniciar una sesión nueva.
- **SC-DATA-003**: Otro usuario autorizado observa el mismo valor confirmado en el 100 % de los casos de validación.
- **SC-DATA-004**: Se detectan cero secretos o materiales de entrega en inventario, detalle y búsqueda.
- **SC-DATA-005**: Un fallo de persistencia produce cero falsos mensajes de éxito.

## Assumptions

- El conjunto representativo contiene volumen y variaciones suficientes para validar búsquedas y estados vacíos.
- La integración con el catálogo corporativo pertenece a la feature 006.
- El ciclo de vida de credenciales se valida en la feature 004.

## Out of Scope

- Sincronización con sistemas corporativos.
- Creación, modificación o eliminación real de instituciones, aplicaciones y roles.
- Consulta de consumo de aplicaciones.
