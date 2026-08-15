# Feature Specification: Credenciales reales y entrega segura

**Feature Branch**: `[008-credenciales-reales-entrega]`

**Created**: 2026-08-15

**Status**: Futuro — requisito previo al piloto real

**Input**: Sustituir el ciclo sintético por operaciones efectivas y una entrega protegida de secretos reales.

## User Scenarios & Testing

### US-REAL-01 — Emitir y rotar credenciales reales (Priority: P1)

Como analista autorizado, quiero emitir o regenerar credenciales reales para habilitar o sustituir el acceso de una aplicación.

**Independent Test**: En un entorno autorizado se comprueban emisión inicial, rotación, reintento y conservación de la versión vigente ante fallo.

**Acceptance Scenarios**:

```gherkin
Escenario: Emisión real completa
  Dado que la aplicación real no tiene una credencial activa
  Cuando el analista autorizado solicita la emisión
  Entonces una única credencial queda activa en el servicio real
  Y se prepara una entrega protegida

Escenario: Rotación real atómica
  Dado que existe una credencial real activa
  Cuando el analista solicita regenerarla
  Entonces la nueva versión queda activa
  Y la anterior deja de ser utilizable sin coexistencia
```

### US-REAL-02 — Suspender, reactivar y revocar de forma efectiva (Priority: P1)

Como analista autorizado, quiero cambiar el estado real de una credencial para controlar su uso efectivo.

**Independent Test**: Se suspende, reactiva y revoca una credencial y se comprueba su aceptación real después de cada transición.

**Acceptance Scenarios**:

```gherkin
Escenario: Revocación efectiva
  Dado que una credencial real está activa o suspendida
  Cuando un perfil autorizado registra el motivo y la revoca
  Entonces el servicio real deja de aceptar la credencial
  Y no puede reactivarse
```

### US-REAL-03 — Entregar secretos de forma protegida (Priority: P1)

Como responsable de integración, quiero recibir las credenciales mediante una entrega protegida para utilizarlas sin exponer el secreto.

**Independent Test**: Se genera una entrega, se usa el OTP una vez y se comprueban caducidad, reutilización y separación entre OTP y contraseña.

**Acceptance Scenarios**:

```gherkin
Escenario: Entrega protegida
  Dado que se ha emitido una credencial real
  Cuando se genera la entrega
  Entonces el secreto se incluye en un ZIP cifrado
  Y el acceso requiere un OTP de un solo uso válido durante dos minutos
  Y la contraseña del ZIP es distinta del OTP
```

### Edge Cases

- La emisión real finaliza pero la entrega no puede generarse.
- La respuesta a una operación se pierde y el usuario la reintenta.
- El OTP caduca o ya se utilizó.
- La revocación real no puede confirmarse.

## Requirements

### Functional Requirements

- **FR-REAL-001**: La emisión, rotación, suspensión, reactivación y revocación DEBEN afectar al servicio real autorizado.
- **FR-REAL-002**: Las operaciones DEBEN volver a autorizarse antes de ejecutarse.
- **FR-REAL-003**: La emisión y rotación NO DEBEN dejar más de una versión activa.
- **FR-REAL-004**: Un fallo NO DEBE dejar estados parciales ni desactivar la versión vigente durante una rotación fallida.
- **FR-REAL-005**: Reintentar la misma solicitud NO DEBE duplicar el efecto de negocio.
- **FR-REAL-006**: La entrega DEBE utilizar un ZIP cifrado, una contraseña distinta del OTP y un OTP de un solo uso válido durante dos minutos.
- **FR-REAL-007**: Client Secret, contraseña y OTP NO DEBEN aparecer en consultas, logs, errores ni auditoría.
- **FR-REAL-008**: La revocación confirmada DEBE impedir el uso posterior de la credencial real.
- **FR-REAL-009**: Todos los intentos DEBEN quedar auditados con su resultado.

### Key Entities

- **Credencial real**: Identidad efectiva de acceso de una aplicación.
- **Versión real**: Emisión o rotación confirmada por el servicio autorizado.
- **Entrega protegida**: ZIP cifrado y mecanismos separados para contraseña y OTP.

## Success Criteria

### Measurable Outcomes

- **SC-REAL-001**: Hay cero aplicaciones con más de una credencial real activa tras emisión o rotación.
- **SC-REAL-002**: El 100 % de las credenciales suspendidas o revocadas probadas deja de ser aceptado por el servicio real.
- **SC-REAL-003**: El 100 % de los OTP reutilizados o caducados se rechaza.
- **SC-REAL-004**: Los reintentos generan cero emisiones, rotaciones o revocaciones duplicadas.
- **SC-REAL-005**: Se detectan cero secretos en pantallas, logs, errores y eventos de auditoría.

## Assumptions

- Existen entornos autorizados y seguros para probar operaciones reales antes del piloto.
- La identidad corporativa y el catálogo real estarán disponibles mediante las features 006 y 007.

## Out of Scope

- Caducidad programada, alertas y renovaciones preventivas.
- Portal externo de autoservicio.
- Auditoría con retención certificada, cubierta por la feature 009.
