# Feature Specification: Publicación web móvil y acceso por perfil

**Feature Branch**: `[002-publicacion-web-acceso]`

**Created**: 2026-08-15

**Status**: Definida para el Sprint MVP web

**Input**: Separación de US-01 y US-13 de la especificación paraguas de KeyOps.

## User Scenarios & Testing

### US-WEB-01 — Acceder según el perfil (Priority: P1)

Como usuario interno predefinido, quiero acceder a KeyOps para utilizar únicamente las acciones permitidas por mi perfil.

**Independent Test**: Se prueba un usuario habilitado, uno deshabilitado y perfiles con permisos distintos; cada acceso o rechazo queda trazado.

**Acceptance Scenarios**:

```gherkin
Escenario: Acceso autorizado
  Dado que el usuario está predefinido, habilitado y dispone de un perfil
  Cuando inicia sesión con datos válidos
  Entonces accede a KeyOps
  Y solo visualiza las acciones permitidas por su perfil

Escenario: Acceso rechazado
  Dado que el usuario no existe o está deshabilitado
  Cuando intenta iniciar sesión
  Entonces el sistema rechaza el acceso sin revelar información sensible
  Y registra el intento fallido
```

### US-WEB-02 — Operar en un ambiente de demostración (Priority: P1)

Como analista, quiero seleccionar el ambiente de trabajo para no mezclar información ni acciones entre pruebas y producción.

**Independent Test**: Se cambia entre los dos ambientes y se comprueba la separación de datos, el perfil aplicado y la identificación visible de demostración.

**Acceptance Scenarios**:

```gherkin
Escenario: Cambio de ambiente
  Dado que existen los ambientes de demostración de pruebas y producción
  Cuando el analista selecciona uno
  Entonces solo ve la información de ese ambiente
  Y el ambiente activo se identifica como demostración sin efectos externos
```

### US-WEB-03 — Utilizar la aplicación web desde móvil (Priority: P1)

Como analista, quiero abrir KeyOps desde un navegador móvil para completar los recorridos incluidos sin instalar una aplicación nativa.

**Independent Test**: Se accede mediante la dirección publicada en dos tamaños de pantalla móvil y se completan acceso, navegación y cambio de ambiente.

**Acceptance Scenarios**:

```gherkin
Escenario: Uso desde navegador móvil
  Dado que la aplicación web está publicada
  Cuando el analista accede desde un navegador móvil compatible
  Entonces puede iniciar sesión, navegar y cambiar de ambiente
  Y no necesita desplazamiento horizontal para completar esos recorridos
```

### Edge Cases

- La sesión caduca mientras el usuario cambia de ambiente.
- Un usuario intenta abrir directamente una pantalla no permitida por su perfil.
- La aplicación publicada no puede recuperar el estado confirmado.

## Requirements

### Functional Requirements

- **FR-WEB-001**: El MVP DEBE estar disponible mediante una dirección web publicada y utilizable desde navegador móvil.
- **FR-WEB-002**: Solo usuarios predefinidos y habilitados PUEDEN acceder.
- **FR-WEB-003**: Las acciones visibles DEBEN corresponder al perfil del usuario y todo acceso directo no autorizado DEBE rechazarse.
- **FR-WEB-004**: Pruebas y producción DEBEN presentarse como ambientes de demostración separados y claramente identificados.
- **FR-WEB-005**: Cambiar de ambiente DEBE descartar la información de pantalla perteneciente al ambiente anterior.
- **FR-WEB-006**: Cerrar sesión DEBE retirar el acceso y limpiar la información sensible visible.
- **FR-WEB-007**: Todos los botones, enlaces y pantallas visibles DEBEN completar su recorrido o devolver un error controlado.
- **FR-WEB-008**: La feature NO DEBE depender de identidad corporativa, instalación nativa ni funcionamiento sin conexión.

### Key Entities

- **Usuario predefinido**: Persona interna habilitada para el caso de estudio.
- **Perfil**: Conjunto de acciones permitidas para analista, analista senior, administrador o auditor.
- **Ambiente de demostración**: Contexto aislado de pruebas o producción sin efectos sobre sistemas reales.
- **Sesión**: Período de acceso autorizado de un usuario.

## Success Criteria

### Measurable Outcomes

- **SC-WEB-001**: El 100 % de los accesos de usuarios inexistentes o deshabilitados se rechaza.
- **SC-WEB-002**: El 100 % de las acciones no permitidas se oculta y también se rechaza al intentar un acceso directo.
- **SC-WEB-003**: Acceso, navegación y cambio de ambiente se completan en 390 × 844 y 360 × 800 sin desplazamiento horizontal.
- **SC-WEB-004**: El 100 % de las pantallas identifica el ambiente activo y su carácter de demostración.
- **SC-WEB-005**: Hay cero controles visibles sin comportamiento funcional.

## Assumptions

- Los usuarios y perfiles necesarios están predefinidos para el caso de estudio.
- Las operaciones del MVP requieren conectividad.
- La identidad corporativa y la administración de usuarios pertenecen a la feature 007.

## Out of Scope

- Identidad corporativa, alta o modificación de usuarios y recuperación de contraseñas.
- Aplicaciones nativas, tiendas, notificaciones y funcionamiento sin conexión.
- Datos, credenciales o ambientes reales.
