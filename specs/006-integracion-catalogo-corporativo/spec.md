# Feature Specification: Integración con catálogo corporativo

**Feature Branch**: `[006-integracion-catalogo-corporativo]`

**Created**: 2026-08-15

**Status**: Futuro — requisito previo al piloto real

**Input**: Sustituir los datos representativos por instituciones, aplicaciones y roles procedentes del catálogo corporativo.

## User Scenarios & Testing

### US-CAT-01 — Consultar el catálogo corporativo (Priority: P1)

Como analista, quiero ver instituciones, aplicaciones y roles vigentes para operar sobre el contexto real autorizado.

**Independent Test**: Un cambio autorizado en el catálogo aparece en KeyOps con el ambiente y alcance correctos, sin permitir su modificación desde KeyOps.

**Acceptance Scenarios**:

```gherkin
Escenario: Consulta de datos corporativos vigentes
  Dado que una aplicación y su rol existen en el catálogo corporativo
  Cuando el analista autorizado consulta KeyOps
  Entonces ve la misma aplicación, institución, rol y ambiente
  Y no puede modificar esos datos desde KeyOps

Escenario: Catálogo no disponible
  Dado que el catálogo corporativo no responde
  Cuando el analista solicita datos que no pueden confirmarse
  Entonces el sistema informa de la indisponibilidad
  Y no sustituye silenciosamente los datos por registros de demostración
```

### Edge Cases

- Una aplicación cambia de institución o rol durante una operación.
- El catálogo devuelve registros duplicados o incompletos.
- Un usuario solicita una institución fuera de su alcance.

## Requirements

### Functional Requirements

- **FR-CAT-001**: Las instituciones, aplicaciones y roles del piloto DEBEN proceder del catálogo corporativo autorizado.
- **FR-CAT-002**: KeyOps DEBE tratarlos como datos de solo consulta.
- **FR-CAT-003**: El ambiente y el alcance del usuario DEBEN aplicarse antes de mostrar resultados.
- **FR-CAT-004**: Una indisponibilidad NO DEBE ocultarse mediante datos de demostración.
- **FR-CAT-005**: Los cambios confirmados del catálogo DEBEN reflejarse sin crear duplicados.
- **FR-CAT-006**: Los errores de datos externos DEBEN producir una respuesta controlada y trazable.

### Key Entities

- **Institución corporativa**: Organización vigente en el catálogo de referencia.
- **Aplicación corporativa**: Integración real asociada a una institución y ambiente.
- **Rol corporativo de API**: Permisos de servicios asignados por el catálogo.

## Success Criteria

### Measurable Outcomes

- **SC-CAT-001**: El 100 % de una muestra acordada de registros coincide con el catálogo en identidad, institución, rol y ambiente.
- **SC-CAT-002**: KeyOps realiza cero modificaciones sobre instituciones, aplicaciones o roles del catálogo.
- **SC-CAT-003**: El 100 % de las indisponibilidades probadas se muestra como error controlado y no como datos de demostración.
- **SC-CAT-004**: Se detectan cero registros fuera del alcance autorizado del usuario.

## Assumptions

- El propietario facilitará permisos, datos de prueba y reglas de identificación del catálogo.
- La persistencia representativa de la feature 003 continúa disponible para desarrollo aislado, no para el piloto.

## Out of Scope

- Crear o administrar instituciones, aplicaciones y roles desde KeyOps.
- Identidad corporativa, credenciales reales y datos de consumo.
