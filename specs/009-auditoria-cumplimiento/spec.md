# Feature Specification: Auditoría de cumplimiento y retención

**Feature Branch**: `[009-auditoria-cumplimiento]`

**Created**: 2026-08-15

**Status**: Siguiente Sprint — requisito previo al piloto real

**Input**: Añadir a la auditoría funcional las garantías de inmutabilidad y conservación exigidas por la constitución.

## User Scenarios & Testing

### US-COMP-01 — Conservar evidencia resistente a modificaciones (Priority: P1)

Como responsable de cumplimiento, quiero que ningún usuario o administrador pueda alterar los eventos para confiar en la trazabilidad.

**Independent Test**: Se intenta modificar y eliminar una muestra de eventos con perfiles operativos y administrativos y se verifica su integridad.

**Acceptance Scenarios**:

```gherkin
Escenario: Intento de modificación
  Dado que existe un evento de auditoría confirmado
  Cuando un usuario o administrador intenta modificarlo o eliminarlo
  Entonces el evento original permanece íntegro
  Y el intento queda registrado
```

### US-COMP-02 — Recuperar eventos durante cinco años (Priority: P1)

Como auditor autorizado, quiero consultar eventos conservados durante cinco años para responder a investigaciones y obligaciones aplicables.

**Independent Test**: Se recupera una muestra representativa de eventos de distintas antigüedades y versiones y se verifica su integridad.

**Acceptance Scenarios**:

```gherkin
Escenario: Consulta dentro del período de retención
  Dado que un evento tiene menos de cinco años
  Cuando un auditor autorizado lo busca por sus campos permitidos
  Entonces el evento completo está disponible
  Y puede verificarse que no fue alterado
```

### Edge Cases

- Cambio de formato o versión durante el período de retención.
- Baja del usuario que originó el evento.
- Solicitud de borrado incompatible con la obligación de conservación.
- Recuperación ante pérdida o corrupción de la fuente principal.

## Requirements

### Functional Requirements

- **FR-COMP-001**: Los eventos confirmados DEBEN ser inmutables frente a usuarios y administradores operativos.
- **FR-COMP-002**: Todo intento de modificación o eliminación DEBE rechazarse y quedar trazado.
- **FR-COMP-003**: Los eventos DEBEN conservarse durante cinco años desde su creación.
- **FR-COMP-004**: Solo perfiles autorizados PUEDEN consultar la auditoría.
- **FR-COMP-005**: Los eventos DEBEN seguir siendo legibles y verificables tras cambios compatibles de formato.
- **FR-COMP-006**: La recuperación ante pérdida DEBE preservar integridad, orden y trazabilidad.
- **FR-COMP-007**: Los eventos NO DEBEN contener secretos ni datos personales innecesarios.

### Key Entities

- **Evento de cumplimiento**: Evidencia auditable con integridad verificable.
- **Período de retención**: Cinco años desde la marca temporal del evento.
- **Intento de alteración**: Acción rechazada sobre un evento confirmado.

## Success Criteria

### Measurable Outcomes

- **SC-COMP-001**: El 100 % de los intentos de modificación o eliminación probados se rechaza y queda trazado.
- **SC-COMP-002**: El 100 % de una muestra de eventos dentro del período de cinco años puede recuperarse y verificarse.
- **SC-COMP-003**: Una prueba de recuperación conserva el 100 % de los eventos, su orden y sus relaciones.
- **SC-COMP-004**: Se detectan cero secretos en la muestra de auditoría de cumplimiento.

## Assumptions

- La política de cinco años ha sido confirmada por el propietario del producto.
- La auditoría funcional de la feature 005 define los eventos mínimos de origen.
- Antes de planificar se acordarán responsables de cumplimiento y recuperación.

## Out of Scope

- Cambiar la matriz funcional de permisos de KeyOps.
- Analítica avanzada sobre eventos.
- Datos de consumo de aplicaciones.
