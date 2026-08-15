<!--
Sync Impact Report
- Version change: 3.0.0 -> 4.0.0
- Modified principles: I. Seguridad de credenciales API; VII. Estado confiable y
  operaciones críticas en línea; VIII. Testing proporcional y cambios verificables;
  IX. Simplicidad deliberada; X. Gobierno explícito de versiones
- Added principles: XI. Persistencia real y evidencia funcional
- Modified sections: Stack tecnológico; Modo de candidato local -> Candidato
  persistente de caso de estudio; Governance
- Added sections: Restricciones de coste y capacidad
- Removed sections: none
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

El token personal de Airtable MUST existir únicamente como secreto del adaptador
servidor. MUST NOT incluirse en el bundle móvil, variables `EXPO_PUBLIC_*`, repositorio,
logs ni respuestas al cliente. La app móvil MUST NOT acceder directamente a Airtable.

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

El servicio remoto, respaldado por Airtable para los datos operativos no secretos,
MUST ser la única fuente de verdad persistente para aplicaciones, usuarios, permisos,
versiones, estados y contexto de gestión. El estado de UI MUST ser inmutable y seguir
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

Los fakes MAY utilizarse en pruebas unitarias y de componentes, pero una historia que
requiera persistencia MUST NOT declararse superada solo con un fake. Su evidencia MUST
incluir al menos una prueba de integración contra una base Airtable de prueba mediante
el adaptador servidor, verificando lectura posterior en una nueva sesión o proceso.
Estas pruebas MUST ejecutarse bajo demanda, reutilizar fixtures sembrados en lotes y
MUST NOT formar parte del bucle continuo de tests unitarios que consumiría la cuota.

### IX. Simplicidad deliberada

KeyOps MUST resolver cada necesidad con la solución más sencilla que cumpla seguridad,
privacidad, auditabilidad y operación. MUST preferirse capacidades estándar de React,
React Native y Expo antes de añadir librerías. Un gestor global de estado, base de
datos local, sincronización offline, generación de código o nueva capa arquitectónica
MUST NOT incorporarse sin un caso de uso verificable y una justificación en `plan.md`.

La persistencia MUST implementarse reutilizando los contratos de repositorio y el
cliente REST existentes. Airtable MUST quedar encapsulado tras un único adaptador
servidor; no se crearán integraciones distintas por pantalla o historia de usuario.

### X. Gobierno explícito de versiones

Las versiones de APIs, contratos, esquemas y dependencias que puedan afectar al
comportamiento MUST estar identificadas y gobernadas. Todo cambio incompatible MUST
declarar impacto, migración, compatibilidad temporal y retirada antes de adoptarse.
Las dependencias MUST fijarse mediante `package-lock.json`; las versiones concretas se
deciden en `plan.md` y no en `spec.md`. La aplicación MUST rechazar de forma segura una
respuesta de API incompatible en lugar de continuar con datos ambiguos.

Los límites y condiciones de los planes gratuitos de Airtable y Cloudflare MUST
revalidarse antes de cada release demostrable. Un cambio del proveedor que introduzca
coste, elimine una capacidad necesaria o reduzca los límites por debajo del uso previsto
MUST tratarse como un cambio de arquitectura y no aceptarse de forma automática.

### XI. Persistencia real y evidencia funcional

La ejecución demostrable de KeyOps MUST utilizar Airtable como persistencia real de los
datos operativos no secretos. Reiniciar la app, abrir una sesión nueva o desplegar una
nueva versión MUST conservar las aplicaciones, estados, usuarios, gestiones y eventos
creados previamente. El modo fake MUST limitarse a desarrollo aislado y pruebas; MUST
NOT ser el origen de datos predeterminado de una demo, validación funcional o release.

Una historia de usuario se considera superada únicamente cuando sus criterios de
aceptación observables se validan con la fuente persistente si la historia crea o
modifica datos. El número de tests o checkboxes completados MUST NOT sustituir esta
evidencia. Se priorizarán las historias que puedan compartir el mismo modelo de datos,
adaptador y flujo de autorización para aumentar cobertura funcional sin añadir capas,
servicios de pago ni implementaciones duplicadas.

## Stack tecnológico

El stack obligatorio de la aplicación móvil es:

- **Lenguaje y runtime de desarrollo**: TypeScript en modo estricto y `npm`; la
  versión concreta de Node se decide en `plan.md` y queda fijada en `.nvmrc`.
- **Aplicación móvil**: React Native sobre Expo. La validación nativa Android/iOS
  se exige solo cuando exista la infraestructura correspondiente.
- **Navegación**: Expo Router con rutas tipadas.
- **UI**: React, componentes de React Native, `StyleSheet` y los tokens del sistema de
  diseño existente en `design/DESIGN.md`; no se adopta una librería de componentes
  adicional por defecto.
- **Estado**: hooks de React, `useReducer` y Context para estado compartido acotado. No
  se usa Redux ni otro gestor global por defecto.
- **Integración**: API REST/JSON mediante `fetch`, encapsulada por repositorios, con
  validación de respuestas externas mediante Zod.
- **Adaptador servidor**: Cloudflare Worker en plan Free, implementado en TypeScript,
  como único backend para la app móvil y único consumidor de la API de Airtable.
- **Persistencia**: una base Airtable en plan Free para datos operativos no secretos,
  accedida mediante Web API y un Personal Access Token almacenado como secreto del
  Worker.
- **Eficiencia**: caché de lecturas en Cloudflare, paginación, batching y `upsert` para
  reducir llamadas a Airtable; el polling periódico queda prohibido.
- **Sesión segura**: `expo-secure-store` exclusivamente para tokens de sesión. Client
  Secrets, contraseñas de ZIP y OTP MUST permanecer solo en memoria el tiempo mínimo
  indispensable y MUST NOT persistirse.
- **Testing**: Jest con `jest-expo` y React Native Testing Library. Maestro se exige
  cuando haya binarios y dispositivos disponibles para E2E nativo.
- **Calidad local**: TypeScript, ESLint y Prettier ejecutables con scripts de `npm`.

La aplicación consume Cloudflare Worker como único endpoint remoto. El Worker aplica
autenticación y autorización, adapta el contrato REST existente y accede a Airtable.
La emisión de secretos reales permanece fuera de Airtable; el caso de estudio MUST usar
datos y secretos sintéticos. Los fakes y el stub HTTP local MAY conservarse para tests
y desarrollo aislado, pero MUST NOT ser el modo predeterminado de demostración. Expo
Application Services es opcional y MUST NOT ser requisito para desarrollar, probar o
ejecutar el caso de estudio.

## Candidato persistente de caso de estudio

El candidato demostrable MUST usar Cloudflare Worker y Airtable, y MUST demostrar que
los cambios persisten entre sesiones. MAY ejecutarse mediante Expo Web cuando no haya
dispositivos, pero esa evidencia MUST identificarse como caso de estudio y MUST NOT
afirmar autenticación corporativa, emisión de credenciales reales, auditoría
antimanipulación, retención efectiva de cinco años ni compatibilidad Android/iOS.

Airtable MUST registrar eventos append-only a través del Worker para demostrar
trazabilidad funcional. Esto no prueba inmutabilidad frente a administradores de la
base ni capacidad de retención a cinco años. Antes de cualquier piloto real, esas
garantías MUST migrarse o validarse contra servicios adecuados para producción.

## Restricciones de coste y capacidad

El caso de estudio MUST mantenerse dentro de los planes gratuitos y MUST NOT activar
suscripciones, add-ons, automatizaciones de pago ni facturación por consumo sin
aprobación expresa. A fecha de esta enmienda, el diseño MUST respetar como máximo:

- Airtable Free: 1.000 registros acumulados por base, 1 GB de adjuntos y 1.000 llamadas
  API por workspace y mes.
- Airtable Web API: 5 solicitudes por segundo y base, páginas de hasta 100 registros y
  lotes de hasta 10 registros por solicitud.
- Cloudflare Workers Free: 100.000 solicitudes diarias y 10 ms de CPU por invocación.

El adaptador MUST cachear lecturas no sensibles, agrupar escrituras, evitar consultas
duplicadas y cargar datos bajo demanda. MUST exponer un error controlado cuando el
proveedor limite peticiones y MUST NOT ocultar un agotamiento de cuota mediante datos
fake. El volumen del caso de estudio MUST presupuestarse antes de implementar las
historias seleccionadas, reservando capacidad para eventos de auditoría.

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

**Version**: 4.0.0 | **Ratified**: 2026-08-08 | **Last Amended**: 2026-08-15
