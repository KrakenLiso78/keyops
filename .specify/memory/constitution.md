<!--
Sync Impact Report
- Version change: 1.0.0 -> 2.0.0
- Modified principles:
  - V. Cambios verificables -> VIII. Testing proporcional y cambios verificables
  - VI. Simplicidad deliberada -> IX. Simplicidad deliberada
  - VII. Gobierno explícito de versiones -> X. Gobierno explícito de versiones
- Added principles:
  - V. Separación entre especificación y plan técnico
  - VI. Arquitectura móvil de tres capas
  - VII. Estado confiable y operaciones críticas en línea
- Added sections: Stack tecnológico; Flujo de Trabajo SDD
- Removed sections: Quality and Compliance Constraints;
  Development Workflow and Quality Gates
- Removed rules: mandatory peer review for security or data changes; formal quality
  gates beyond the constitution principles
- Follow-up TODOs: none
-->

# KeyOps Constitution

## Core Principles

### I. Seguridad de credenciales API (NON-NEGOTIABLE)
Las credenciales API MUST permanecer protegidas durante su generación, consulta,
renovación, exportación, uso y revocación. La aplicación móvil MUST NOT generar ni
almacenar Client Secrets, contraseñas de ZIP u OTP en almacenamiento persistente. El
Client Secret MUST NOT aparecer en pantallas de consulta, logs, errores, analítica ni
artefactos de depuración. Toda operación sensible MUST usar autenticación,
autorización y transporte cifrado; la emisión real de secretos MUST ejecutarse en un
servicio de confianza fuera del dispositivo.

### II. Mínimo privilegio
Cada usuario, sesión, servicio y operación MUST disponer únicamente de los permisos
necesarios para su propósito y durante el tiempo necesario. La interfaz MUST mostrar
solo las acciones permitidas, pero el servicio remoto MUST volver a autorizar cada
operación: ocultar un botón no constituye un control de seguridad. Los permisos MUST
denegarse por defecto y cualquier elevación temporal MUST quedar autorizada y
registrada.

### III. Auditabilidad completa
Toda operación relevante sobre acceso, credenciales, aplicaciones, ambientes,
permisos y configuración MUST generar un registro auditable con actor, acción,
recurso, ambiente, resultado, IP de origen y marca temporal. Los intentos fallidos y
rechazados MUST registrarse igual que los exitosos. Los registros MUST ser inmutables,
consultables solo por perfiles autorizados y conservados durante cinco años. La
aplicación móvil MUST NOT tratar su estado local o sus logs como registro de auditoría.

### IV. Privacidad por diseño
KeyOps MUST tratar los datos personales y operativos con minimización, finalidad
limitada, acceso restringido y retención definida. Las pantallas, logs, eventos,
notificaciones y exportaciones MUST excluir datos innecesarios y aplicar enmascarado
cuando la identificación completa no sea necesaria. La aplicación MUST limpiar datos
sensibles de memoria visual al cerrar sesión, caducar la sesión o pasar a segundo
plano cuando exista riesgo de exposición.

### V. Separación entre especificación y plan técnico
`spec.md` documenta exclusivamente el **qué** y el comportamiento: historias de
usuario, requisitos funcionales y criterios de aceptación, sin detalles técnicos.
`plan.md` concentra exclusivamente el **cómo**: stack, arquitectura, estructura de
carpetas y decisiones de implementación. El agente MUST NOT introducir detalles
técnicos en `spec.md` ni decisiones de comportamiento o negocio nuevas en `plan.md`.

**Rationale**: evita que el agente mezcle niveles de abstracción, mantiene `spec.md`
legible para validar comportamiento sin ruido técnico y mantiene `plan.md` como la
única fuente de verdad técnica de cada feature.

Esta constitución MAY fijar restricciones técnicas transversales del proyecto; cada
`plan.md` MUST concretarlas para su feature sin contradecirlas ni duplicar decisiones
de comportamiento.

### VI. Arquitectura móvil de tres capas
La aplicación MUST organizarse en tres capas lógicas claramente separadas:

1. **UI o presentación**: pantallas, componentes, navegación y estado de pantalla.
   MUST limitarse a representar estado e informar de intenciones del usuario.
2. **Lógica de negocio o dominio**: casos de uso, permisos, validaciones, máquina de
   estados y reglas de ambiente. MUST ser TypeScript independiente de React Native y
   Expo.
3. **Datos**: repositorios, cliente HTTP, adaptación de DTO y almacenamiento seguro de
   sesión. MUST ocultar a las capas superiores el origen concreto de los datos.

La UI MUST NOT acceder directamente a red o almacenamiento. Las dependencias MUST
apuntar a contratos de dominio; las implementaciones de datos se conectan mediante
inyección explícita en el punto de composición. Cada caso de uso MUST representar una
capacidad de negocio real; no se crearán abstracciones vacías para operaciones
triviales.

### VII. Estado confiable y operaciones críticas en línea
El servicio remoto MUST ser la única fuente de verdad para credenciales, permisos,
auditoría, versiones y estados operativos. El estado de UI MUST ser inmutable y seguir
flujo unidireccional: el estado baja hacia las vistas y los eventos suben hacia su
controlador o hook de pantalla. La app MUST NOT mantener colas offline ni presentar
éxito optimista para generar, regenerar, suspender, reactivar o revocar credenciales.

Cada solicitud crítica MUST incluir el ambiente activo y la UI MUST mantener Pruebas
y Producción inequívocamente separados. Un cambio de ambiente MUST descartar el estado
de pantalla dependiente del ambiente anterior. Ante un fallo, la app MUST conservar el
último estado confirmado por el servidor, mostrar un error persistente y permitir un
reintento seguro sin duplicar la operación.

### VIII. Testing proporcional y cambios verificables
El conjunto de pruebas MUST concentrarse en riesgo y comportamiento observable:

- Pruebas unitarias para permisos, transiciones de estado, validaciones, separación de
  ambientes y tratamiento de errores en la capa de negocio.
- Pruebas de componentes o integración para estados de carga, vacío y error,
  visibilidad por rol, confirmaciones críticas y ausencia de secretos en pantalla.
- Un conjunto pequeño de pruebas E2E para autenticación, cambio de ambiente y al menos
  un flujo crítico completo del ciclo de vida de credenciales.

Las pruebas MUST usar repositorios falsos en los límites de datos y MUST NOT depender
principalmente de snapshots ni de detalles internos de implementación. No se fija un
porcentaje arbitrario de cobertura. Cada corrección de un defecto MUST añadir una
prueba de regresión cuando sea técnica y proporcionalmente viable. Todo cambio MUST
ser trazable a una especificación o decisión y aportar evidencia repetible de la
validación aplicable.

### IX. Simplicidad deliberada
KeyOps MUST resolver cada necesidad con la solución más sencilla que cumpla seguridad,
privacidad, auditabilidad y operación. MUST preferirse capacidades estándar de React,
React Native y Expo antes de añadir librerías. Un gestor global de estado, base de
datos local, sincronización offline, generación de código o nueva capa arquitectónica
MUST NOT incorporarse sin un caso de uso verificable y una justificación en `plan.md`.

### X. Gobierno explícito de versiones
Las versiones de APIs, contratos, esquemas y dependencias que puedan afectar al
comportamiento MUST estar identificadas y gobernadas. Todo cambio incompatible MUST
declarar impacto, migración, compatibilidad temporal y retirada antes de adoptarse.
Las dependencias MUST fijarse mediante `package-lock.json`; las versiones concretas se
deciden en `plan.md` y no en `spec.md`. La aplicación MUST rechazar de forma segura una
respuesta de API incompatible en lugar de continuar con datos ambiguos.

## Stack tecnológico

El stack obligatorio de la aplicación móvil es:

- **Lenguaje y runtime de desarrollo**: TypeScript en modo estricto, Node.js LTS y
  `npm`.
- **Aplicación móvil**: React Native sobre el framework Expo, para Android e iOS, sin
  código nativo personalizado mientras no exista una necesidad demostrada.
- **Navegación**: Expo Router con rutas tipadas.
- **UI**: React, componentes de React Native, `StyleSheet` y los tokens del sistema de
  diseño existente en `design/DESIGN.md`; no se adopta una librería de componentes
  adicional por defecto.
- **Estado**: hooks de React, `useReducer` y Context para estado compartido acotado. No
  se usa Redux ni otro gestor global por defecto.
- **Integración**: API REST/JSON mediante `fetch`, encapsulada por repositorios, con
  validación de respuestas externas mediante Zod.
- **Sesión segura**: `expo-secure-store` exclusivamente para tokens de sesión. Client
  Secrets, contraseñas de ZIP y OTP MUST permanecer solo en memoria el tiempo mínimo
  indispensable y MUST NOT persistirse.
- **Testing**: Jest con `jest-expo`, React Native Testing Library y Maestro para los
  pocos flujos E2E críticos.
- **Calidad local**: TypeScript, ESLint y Prettier ejecutables con scripts de `npm`.

La aplicación consume servicios remotos existentes para catálogo, autenticación,
credenciales y auditoría. Durante el caso de estudio MAY utilizarse un adaptador falso
en memoria que implemente los mismos contratos de repositorio y utilice únicamente
datos sintéticos. Expo Application Services es opcional y MUST NOT ser requisito para
desarrollar, probar o ejecutar el caso de estudio localmente.

## Flujo de Trabajo SDD

El flujo estándar de Spec Kit aplica sin modificaciones:
`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` →
`/speckit-implement`.

La separación de `spec.md` y `plan.md` definida en el Principio V es la única regla de
gobernanza adicional sobre este flujo para este proyecto. No se define un proceso de
code review formal ni quality gates adicionales más allá del cumplimiento de los
principios anteriores.

## Governance

Esta constitución prevalece sobre prácticas locales incompatibles. Toda modificación
MUST documentar motivo, impacto, principios afectados y fecha. Añadir un principio o
ampliar materialmente su alcance incrementa MINOR; redefinir, eliminar o relajar una
obligación de forma incompatible incrementa MAJOR; una aclaración no semántica
incrementa PATCH.

El agente MUST comprobar el cumplimiento de la constitución al producir o modificar
`spec.md`, `plan.md`, `tasks.md` y código, sin convertir esa comprobación en un proceso
formal de code review. Una desviación MUST quedar explícitamente justificada en el
artefacto técnico correspondiente; una excepción de seguridad, privacidad o
auditabilidad MUST incluir alcance, riesgo, mitigación, responsable y caducidad. No se
considerará aprobada una excepción implícita.

**Version**: 2.0.0 | **Ratified**: 2026-08-08 | **Last Amended**: 2026-08-08
