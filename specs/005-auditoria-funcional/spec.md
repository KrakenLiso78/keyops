# Feature Specification: Auditoría funcional persistente

**Feature Branch**: `[005-auditoria-funcional]`

**Created**: 2026-08-15

**Status**: Definida para el Sprint MVP web

**Input**: Separación de US-08 y US-12 de la especificación paraguas de KeyOps.

## User Scenarios & Testing

### US-AUD-01 — Registrar acciones e intentos (Priority: P1)

Como organización, quiero que las acciones relevantes queden registradas para reconstruir qué ocurrió en el caso de estudio.

**Independent Test**: Se ejecutan una operación exitosa, una fallida y una rechazada; las tres generan eventos persistentes completos.

**Acceptance Scenarios**:

```gherkin
Escenario: Registro de resultados distintos
  Dado que un usuario intenta una operación relevante
  Cuando la operación termina con éxito, error o rechazo
  Entonces se conserva un evento con actor, acción, recurso, ambiente, resultado, IP de origen y fecha y hora
```

### US-AUD-02 — Consultar y filtrar el historial (Priority: P1)

Como auditor, administrador o analista senior, quiero consultar el historial para verificar operaciones e investigar incidencias.

**Independent Test**: Con eventos de distintos usuarios, fechas, instituciones, aplicaciones y resultados se comprueban permisos, ordenación, filtros y ausencia de coincidencias.

**Acceptance Scenarios**:

```gherkin
Escenario: Consulta autorizada
  Dado que existen eventos persistentes y el usuario tiene un perfil autorizado
  Cuando consulta el historial y aplica filtros
  Entonces ve únicamente los eventos coincidentes ordenados cronológicamente

Escenario: Consulta no autorizada
  Dado que un analista sin permiso intenta consultar la auditoría
  Cuando solicita el historial
  Entonces el sistema rechaza la consulta
  Y registra el intento rechazado
```

### Edge Cases

- El recurso afectado deja de existir después de registrar el evento.
- Un filtro no devuelve coincidencias.
- Un intento rechazado carece de algunos datos del recurso solicitado.
- Dos eventos comparten la misma marca temporal.

## Requirements

### Functional Requirements

- **FR-AUD-001**: Accesos y operaciones relevantes DEBEN registrar resultados exitosos, fallidos y rechazados.
- **FR-AUD-002**: Cada evento DEBE incluir actor, acción, recurso, ambiente, resultado, IP de origen y fecha y hora.
- **FR-AUD-003**: Los eventos DEBEN persistir entre sesiones y añadirse sin posibilidad de edición o eliminación desde la aplicación.
- **FR-AUD-004**: Solo auditor, administrador y analista senior PUEDEN consultar el historial.
- **FR-AUD-005**: El historial DEBE permitir filtrar por fechas, institución, aplicación, usuario y resultado.
- **FR-AUD-006**: Los resultados DEBEN ordenarse cronológicamente de forma determinista.
- **FR-AUD-007**: La ausencia de coincidencias DEBE mostrarse sin ocultar los filtros aplicados.
- **FR-AUD-008**: Los eventos NO DEBEN contener Client Secrets, códigos, contraseñas ni enlaces de entrega.

### Key Entities

- **Evento de auditoría funcional**: Evidencia persistente de una acción o intento del caso de estudio.
- **Actor**: Usuario que ejecuta o intenta la operación.
- **Resultado**: Éxito, fallo o rechazo, con una causa segura para consulta autorizada.

## Success Criteria

### Measurable Outcomes

- **SC-AUD-001**: El 100 % de las operaciones P1 probadas genera un evento completo, tanto si termina con éxito como si falla o se rechaza.
- **SC-AUD-002**: El 100 % de los eventos continúa disponible después de cerrar e iniciar una sesión nueva.
- **SC-AUD-003**: El 100 % de las consultas no autorizadas se rechaza y queda trazado.
- **SC-AUD-004**: Los filtros devuelven exclusivamente eventos coincidentes en todos los conjuntos de prueba.
- **SC-AUD-005**: Se detectan cero secretos o materiales de entrega en el historial.

## Assumptions

- Las demás features emiten información suficiente para construir sus eventos.
- Puede sembrarse un conjunto mínimo de eventos para validar esta feature de forma independiente.
- Las garantías de cumplimiento pertenecen a la feature 009.

## Out of Scope

- Resistencia a modificación por administradores de la fuente persistente.
- Conservación garantizada durante cinco años.
- Exportación certificada o integración con plataformas corporativas de auditoría.
