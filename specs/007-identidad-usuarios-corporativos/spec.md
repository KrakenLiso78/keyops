# Feature Specification: Identidad y usuarios corporativos

**Feature Branch**: `[007-identidad-usuarios-corporativos]`

**Created**: 2026-08-15

**Status**: Futuro — requisito previo al piloto real

**Input**: Incorporar autenticación corporativa y la administración de usuarios definida originalmente en US-14.

## User Scenarios & Testing

### US-ID-01 — Acceder con identidad corporativa (Priority: P1)

Como empleado autorizado, quiero acceder con mi identidad corporativa para no depender de usuarios predefinidos del caso de estudio.

**Independent Test**: Se prueba una identidad autorizada, una no autorizada y una deshabilitada, verificando permisos y auditoría.

**Acceptance Scenarios**:

```gherkin
Escenario: Acceso corporativo autorizado
  Dado que el empleado está activo y autorizado
  Cuando se identifica mediante el mecanismo corporativo
  Entonces accede con el perfil asignado
  Y el acceso queda auditado

Escenario: Empleado deshabilitado
  Dado que el empleado está deshabilitado o ya no está autorizado
  Cuando intenta acceder
  Entonces el sistema rechaza el acceso
  Y registra el intento
```

### US-ID-02 — Gestionar usuarios y perfiles (Priority: P1)

Como administrador, quiero habilitar, deshabilitar y asignar perfiles para controlar quién puede operar KeyOps.

**Independent Test**: Un administrador registra, modifica y deshabilita usuarios sin duplicar identidades y comprueba el efecto sobre sus permisos.

**Acceptance Scenarios**:

```gherkin
Escenario: Cambio de perfil
  Dado que un usuario corporativo está registrado
  Cuando el administrador le asigna otro perfil
  Entonces sus permisos efectivos se actualizan
  Y el cambio queda auditado

Escenario: Identidad duplicada
  Dado que la identidad corporativa ya está registrada
  Cuando el administrador intenta crearla de nuevo
  Entonces no se crea un usuario duplicado
```

### Edge Cases

- El usuario pierde autorización durante una sesión activa.
- Un administrador intenta retirarse a sí mismo el último permiso administrativo.
- La identidad corporativa cambia su dato visible pero mantiene el mismo identificador.

## Requirements

### Functional Requirements

- **FR-ID-001**: El piloto DEBE autenticar usuarios mediante identidad corporativa.
- **FR-ID-002**: El acceso DEBE denegarse por defecto a identidades no autorizadas o deshabilitadas.
- **FR-ID-003**: Un administrador DEBE poder habilitar, deshabilitar y asignar perfiles.
- **FR-ID-004**: El sistema NO DEBE permitir identidades duplicadas.
- **FR-ID-005**: Los cambios de perfil DEBEN afectar a las autorizaciones efectivas y a las sesiones según la política aprobada.
- **FR-ID-006**: Accesos, rechazos y cambios administrativos DEBEN quedar auditados.
- **FR-ID-007**: Los usuarios NO DEBEN poder elevar sus propios privilegios.

### Key Entities

- **Identidad corporativa**: Identificador estable de una persona en la organización.
- **Usuario autorizado**: Identidad habilitada para KeyOps.
- **Perfil**: Conjunto de acciones permitidas.

## Success Criteria

### Measurable Outcomes

- **SC-ID-001**: El 100 % de las identidades no autorizadas o deshabilitadas se rechaza.
- **SC-ID-002**: El 100 % de los cambios de perfil produce los permisos esperados sin reiniciar datos operativos.
- **SC-ID-003**: Se crean cero identidades duplicadas en las pruebas de alta repetida.
- **SC-ID-004**: El 100 % de los accesos, rechazos y cambios administrativos queda auditado.

## Assumptions

- La organización dispone de una fuente corporativa de identidad y de responsables para aprobar accesos.
- La matriz de permisos de la especificación paraguas sigue vigente.

## Out of Scope

- Administración del directorio corporativo desde KeyOps.
- Invitaciones a usuarios externos.
- Ciclo de vida de credenciales reales.
