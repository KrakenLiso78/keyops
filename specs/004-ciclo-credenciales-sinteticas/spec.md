# Feature Specification: Ciclo de vida de credenciales sintéticas

**Feature Branch**: `[004-ciclo-credenciales-sinteticas]`

**Created**: 2026-08-15

**Status**: Definida para el Sprint MVP web

**Input**: Separación de US-04, US-05, US-06, US-07 y US-09 de la especificación paraguas de KeyOps.

## User Scenarios & Testing

### US-CRED-01 — Emitir una credencial sintética (Priority: P1)

Como analista autorizado, quiero emitir y activar una credencial sintética para completar el recorrido sin conceder acceso real.

**Independent Test**: Una aplicación sin credenciales recibe una versión activa, un artefacto sintético y un código de un solo uso; una aplicación activa rechaza una segunda emisión.

**Acceptance Scenarios**:

```gherkin
Escenario: Emisión inicial sintética
  Dado que la aplicación no tiene una credencial activa
  Cuando el analista autorizado solicita la emisión
  Entonces se crea una única versión activa
  Y se ofrece un artefacto sintético sin secretos reales
  Y se registra la operación
```

### US-CRED-02 — Regenerar una credencial sintética (Priority: P1)

Como analista autorizado, quiero regenerar una credencial para sustituir su versión vigente sin duplicar versiones activas.

**Independent Test**: Se comprueban rotación correcta, rechazo sin versión previa y conservación de la vigente ante un fallo.

**Acceptance Scenarios**:

```gherkin
Escenario: Rotación correcta
  Dado que existe una credencial sintética activa
  Cuando el analista solicita regenerarla
  Entonces se activa una única versión nueva
  Y la versión anterior queda inactiva por rotación

Escenario: Fallo de regeneración
  Dado que existe una credencial activa
  Cuando la regeneración no puede completarse
  Entonces la versión vigente permanece activa
  Y el sistema no comunica éxito
```

### US-CRED-03 — Suspender y reactivar (Priority: P1)

Como analista autorizado, quiero suspender y reactivar una credencial sintética para validar el control temporal de su estado.

**Independent Test**: Se suspende una credencial activa, se reactiva una suspendida y se rechaza la transición desde una credencial revocada.

**Acceptance Scenarios**:

```gherkin
Escenario: Suspensión y reactivación
  Dado que una credencial sintética está activa
  Cuando el analista registra un motivo y la suspende
  Entonces queda suspendida y no admite operaciones de uso en la demostración
  Y cuando registra un motivo y la reactiva vuelve a quedar activa
```

### US-CRED-04 — Revocar definitivamente (Priority: P1)

Como analista senior, quiero revocar una credencial sintética para impedir cualquier operación posterior sobre ella.

**Independent Test**: Se revoca desde estado activo y suspendido, se intenta repetir la revocación y se comprueba el bloqueo posterior.

**Acceptance Scenarios**:

```gherkin
Escenario: Revocación autorizada
  Dado que la credencial está activa o suspendida
  Cuando un analista senior registra el motivo y la revoca
  Entonces queda revocada de forma definitiva en la demostración
  Y no puede descargarse, reactivarse ni revocarse otra vez
```

### US-CRED-05 — Reentregar material sintético (Priority: P2)

Como analista, quiero solicitar una nueva entrega sintética para repetir el recorrido sin reutilizar el código anterior.

**Independent Test**: Se solicita una reentrega vigente y se comprueba el rechazo con credenciales inexistentes o revocadas y con el código anterior.

**Acceptance Scenarios**:

```gherkin
Escenario: Nueva entrega
  Dado que existe una credencial sintética vigente
  Cuando el analista solicita una nueva entrega
  Entonces recibe un artefacto sintético nuevo
  Y un código nuevo de un solo uso válido durante dos minutos
  Y el código anterior deja de aceptarse
```

### Edge Cases

- Dos solicitudes iguales llegan después de una respuesta incierta.
- El código de demostración ha caducado o ya se utilizó.
- La credencial cambia de estado antes de confirmar una acción.
- Un perfil sin permiso intenta revocar.

## Requirements

### Functional Requirements

- **FR-CRED-001**: Todas las credenciales y entregas de esta feature DEBEN identificarse como sintéticas.
- **FR-CRED-002**: Una aplicación NO DEBE tener más de una versión activa.
- **FR-CRED-003**: La emisión inicial solo DEBE permitirse cuando no existe una versión activa.
- **FR-CRED-004**: La regeneración DEBE activar la nueva versión e inactivar la anterior en una única operación confirmada.
- **FR-CRED-005**: Un fallo de emisión o regeneración DEBE conservar el último estado confirmado.
- **FR-CRED-006**: Suspender, reactivar y revocar DEBEN exigir motivo y permiso.
- **FR-CRED-007**: Una credencial revocada NO DEBE reactivarse ni recibir nuevas entregas.
- **FR-CRED-008**: Cada entrega DEBE generar un artefacto sintético y un código de un solo uso válido durante dos minutos.
- **FR-CRED-009**: El artefacto NO DEBE contener secretos reales.
- **FR-CRED-010**: Repetir una solicitud tras una respuesta incierta NO DEBE duplicar el efecto de negocio.
- **FR-CRED-011**: Cada resultado confirmado DEBE persistir entre sesiones y ser visible para usuarios autorizados.
- **FR-CRED-012**: Cada intento exitoso, fallido o rechazado DEBE generar información suficiente para la auditoría funcional.

### Key Entities

- **Credencial sintética**: Identidad de demostración con estado, ambiente y versión, sin acceso real.
- **Versión**: Emisión o regeneración relacionada con su versión anterior.
- **Entrega sintética**: Artefacto sin secretos reales asociado a una versión.
- **Código de demostración**: Código de un solo uso y vigencia de dos minutos.

## Success Criteria

### Measurable Outcomes

- **SC-CRED-001**: El 100 % de las operaciones válidas deja el estado esperado visible en una sesión posterior.
- **SC-CRED-002**: Hay cero aplicaciones con más de una versión activa tras las pruebas de emisión y regeneración.
- **SC-CRED-003**: El 100 % de los reintentos de una solicitud ya confirmada produce un único efecto de negocio.
- **SC-CRED-004**: El 100 % de los códigos reutilizados o caducados se rechaza.
- **SC-CRED-005**: Se detectan cero secretos reales en pantallas, entregas y mensajes de error.

## Assumptions

- Existen aplicaciones representativas suficientes para probar cada estado.
- Los perfiles y ambientes proceden de las features 002 y 003 o de datos mínimos equivalentes para una prueba independiente.
- La operación sobre credenciales reales pertenece a la feature 008.

## Out of Scope

- Emisión o invalidación en servicios reales.
- ZIP cifrado real, contraseña separada y canales corporativos de entrega.
- Fechas de caducidad de credenciales, alertas y renovaciones preventivas.
