# Phase 0 — Investigación y decisiones técnicas

**Feature**: `001-gestion-credenciales-api`

**Fecha**: 2026-08-10

**Estado**: decisiones cerradas para planificación

## 1. Runtime y stack móvil

**Decisión**: usar Node.js `24.19.0` LTS con npm `11.17.0`, Expo SDK 57,
React Native `0.86.x`, React `19.2.3` y TypeScript `~6.0.3` estricto. El
proyecto se crea en `mobile/` con el template estable `default@sdk-57`. Las
versiones exactas resueltas quedan fijadas en `package-lock.json` y se instalan
con `npm ci`.

**Rationale**: Node 24 es el LTS actual y Expo 57 es la línea estable actual. El
template oficial alinea React Native, React, TypeScript, Metro y módulos Expo;
copiar dependencias a mano aumenta el riesgo de una combinación no soportada.

**Alternativas consideradas**:

- Node 22 LTS: compatible, pero sin ventaja para un proyecto nuevo.
- Node 26: descartado porque sigue en canal Current, no LTS.
- Expo canary/beta: descartado por riesgo innecesario en un MVP de seguridad.
- TypeScript 7: ya es estable, pero se pospone hasta que Expo/Jest documenten la
  combinación; TypeScript 6 es la versión del template SDK 57.

**Fuentes**:

- [Versiones y soporte de Expo SDK](https://docs.expo.dev/versions/latest/)
- [Crear un proyecto Expo](https://docs.expo.dev/get-started/create-a-project/)
- [Calendario de versiones de Node.js](https://nodejs.org/en/about/previous-releases)
- [Node.js 24.19.0 LTS](https://nodejs.org/en/blog/release/v24.19.0)
- [TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)

## 2. Flujo nativo y plataformas

**Decisión**: mantener New Architecture y Continuous Native Generation. No se
versionan `ios/` ni `android/` y no se añade código nativo personalizado. La
matriz mínima es Android 7.0+ (API 24, compile/target 36) e iOS 16.4+ con Xcode
26.4+. El desarrollo funcional y E2E se realiza sobre development builds; Expo
Go queda limitado a comprobaciones visuales tempranas.

**Rationale**: React Native 0.86 ya usa exclusivamente New Architecture. CNG
mantiene la configuración nativa reproducible a partir de `app.json` y evita dos
proyectos nativos que KeyOps no necesita. Maestro requiere el app id propio para
los recorridos reales.

**Alternativas consideradas**:

- Bare workflow: descartado porque no existe necesidad nativa demostrada.
- Expo Go como entorno principal: descartado porque no representa el binario
  propio ni permite el mismo arranque E2E por app id.
- EAS obligatorio: descartado; es útil para distribución posterior, pero el
  proyecto debe poder construirse y probarse localmente.

**Fuentes**:

- [New Architecture en Expo](https://docs.expo.dev/guides/new-architecture/)
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Maestro con React Native y Expo](https://docs.maestro.dev/platform-support/react-native)

## 3. Navegación y estructura

**Decisión**: Expo Router en `mobile/src/app` con `experiments.typedRoutes: true`
y rutas absolutas. Los ficheros de ruta son adaptadores de presentación; toda
lógica reside en controladores, casos de uso y repositorios. No se usa barra
inferior para el flujo mínimo.

**Rationale**: la constitución exige Expo Router y tres capas. Las rutas tipadas
reducen errores de navegación y el sistema de archivos refleja el recorrido
Acceso → Inventario → Detalle → Operación/Resultado, además de Auditoría y
Usuarios.

**Alternativas consideradas**:

- React Navigation importado directamente: descartado; Expo Router 57 ofrece la
  API necesaria y evita otra superficie de configuración.
- Navegación manual o un único componente raíz: descartado por pérdida de rutas
  tipadas, deep links de prueba y separación de pantallas.
- Secretos en parámetros de ruta: descartado porque quedarían expuestos en URLs,
  historial y depuración.

**Fuente**:
[Rutas tipadas de Expo Router](https://docs.expo.dev/router/reference/typed-routes/).

## 4. Arquitectura, composición y estado

**Decisión**: tres capas lógicas:

1. Presentación: rutas, componentes, controladores y estado de pantalla.
2. Dominio: entidades, políticas, puertos y casos de uso TypeScript puros.
3. Datos: HTTP, Zod, mappers, repositorios, SecureStore y fakes.

`createAppDependencies` compone el grafo una vez. Existen composiciones remota y
fake que implementan los mismos puertos. `SessionProvider` y
`EnvironmentProvider` son los únicos contextos compartidos; cada pantalla usa
`useReducer` para su estado.

**Rationale**: satisface la dirección de dependencias constitucional, permite
probar dominio sin React Native y aísla los contratos corporativos aún no
publicados. Un fake sintético permite avanzar sin fingir garantías remotas.

**Alternativas consideradas**:

- Redux/Zustand: descartados; no hay estado global complejo ni caso de uso que
  justifique otra dependencia.
- Acceso a `fetch` desde hooks/pantallas: descartado porque acopla UI, contrato y
  manejo de errores.
- Un mock de red distinto por pantalla: descartado porque puede divergir del
  contrato de repositorio y ocultar errores de integración.

## 5. Contrato remoto y versionado

**Decisión**: establecer
[`contracts/mobile-api.openapi.yaml`](./contracts/mobile-api.openapi.yaml) como
frontera lógica que consume el móvil: HTTPS/JSON, Bearer token, `/v1`, ambiente
en la ruta, fechas RFC 3339 UTC, identificadores opacos y errores normalizados.
Los adaptadores pueden orquestar uno o varios servicios existentes, pero dominio
y presentación solo conocen esa frontera.

Cada respuesta lleva `contractVersion: "1"`; Zod rechaza formas o enums
incompatibles. Un cambio incompatible exige `/v2` o una ventana explícita de
compatibilidad. El repositorio móvil no implementa un backend ni el site de
entrega.

**Rationale**: el repositorio no contiene OpenAPI, URLs ni schemas de los
servicios existentes. Un contrato consumidor explícito permite desarrollar,
probar y detectar brechas sin introducir detalles de cada backend en la UI.

**Alternativas consideradas**:

- Consumir DTO sin validación: descartado porque una respuesta ambigua no puede
  atravesar el límite de datos.
- BFF dentro de este repositorio: descartado por alcance y complejidad.
- GraphQL: descartado porque la constitución fija REST/JSON y no existe evidencia
  de necesidad.

## 6. Autenticación y sesión

**Decisión**: `AuthRepository` abstrae el proveedor. El contrato inicial usa
sesión Bearer y el formulario usuario/contraseña de `DESIGN.md`; el adaptador
fake usa identidades sintéticas. SecureStore conserva únicamente access/refresh
token mediante API async. Perfil y permisos se recuperan del servicio y viven en
memoria.

Un 401 elimina tokens y estado protegido. El servidor vuelve a autorizar cada
operación; ocultar acciones es solo una ayuda de UI. Si el proveedor corporativo
adopta SSO/MFA, se sustituye el adaptador y la pantalla de acceso sin cambiar
casos de uso operativos.

**Rationale**: el diseño visual fija la interacción inicial, pero no un protocolo
corporativo. El puerto mantiene esa decisión reversible y SecureStore es el
único almacenamiento persistente autorizado por la constitución.

**Alternativas consideradas**:

- Persistir usuario, permisos o datos de aplicación: descartado; el servidor es
  la fuente de verdad.
- Activar biometría en SecureStore: descartado porque no es un requisito y
  cambios biométricos pueden invalidar las claves.
- Cookies o credenciales de usuario persistidas: descartadas por seguridad y
  ausencia de requisito.

**Fuente**:
[Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/).

## 7. Operaciones críticas, atomicidad e idempotencia

**Decisión**: emisión, regeneración, entrega y cambios de estado usan
`Idempotency-Key`. La UI sigue `confirming → submitting → succeeded | failed`,
bloquea dobles pulsaciones y no muta la proyección confirmada hasta validar la
respuesta. El servicio devuelve `operationId`, `requestId`, estado resultante y
evidencia de auditoría.

El cliente no implementa compensaciones ni asume atomicidad. Emisión y
regeneración solo se aceptan contra el entorno remoto si pruebas de contrato
demuestran que el servicio conserva el estado previo ante fallo y deduplica un
reintento. En ausencia de esa capacidad, la integración real queda bloqueada,
aunque el caso de estudio fake pueda continuar.

**Rationale**: la app no puede garantizar por sí sola activación atómica,
rotación sin coexistencia o auditoría inmutable. Idempotencia, resultado
autoritativo y reconciliación remota son necesarios para el reintento seguro que
exige la constitución.

**Alternativas consideradas**:

- Éxito optimista: descartado expresamente por la constitución.
- Reintento automático ciego: descartado porque podría duplicar una emisión.
- Cola offline: descartada porque las operaciones críticas son online-only.

## 8. Ambiente y cancelación

**Decisión**: `Environment` es `test | production`; aparece en la ruta de toda
consulta/comando operativo y se pasa explícitamente a cada caso de uso. Cambiar
ambiente aborta solicitudes, descarta lista/detalle/operación y vuelve al
inventario. Una secuencia de petición impide aplicar respuestas tardías.

**Rationale**: hace la separación comprobable en tipos, rutas, repositorios y
UI, en lugar de depender solo de un contexto global o un color.

**Alternativas consideradas**:

- Cabecera implícita fijada por el cliente HTTP: descartada porque facilita
  consultas accidentales al ambiente anterior.
- Cache compartida con una clave ambiente: descartada; el MVP no necesita cache
  persistente y el descarte completo es más seguro.

## 9. Entrega protegida y privacidad visual

**Decisión**: el móvil nunca recibe el ZIP ni su contraseña. La respuesta de
emisión, regeneración o reenvío contiene `deliveryUrl`, OTP y `otpExpiresAt`.
Ambos aparecen en tarjetas separadas; compartir usa `Share` solo con el enlace y
copiar el OTP usa `expo-clipboard` por acción explícita.

OTP y enlace viven únicamente en el estado de la operación. La pantalla usa
`expo-screen-capture`, muestra una cubierta de privacidad al pasar a segundo
plano y limpia valores al caducar, cancelar, cerrar sesión o abandonar. Al
vencer el OTP se vacía el portapapeles. No se registran cuerpos HTTP ni valores
sensibles.

**Rationale**: `DESIGN.md` aclara que el analista no descarga la credencial y que
el destinatario usa un site separado. Esta solución respeta esa frontera y la
obligación constitucional de minimizar exposición.

**Alternativas consideradas**:

- Descargar/compartir el ZIP desde el móvil: descartado por el diseño aprobado.
- Compartir enlace y OTP en un único mensaje: descartado expresamente.
- Persistir el resultado para recuperarlo: descartado; debe solicitarse una nueva
  entrega si se pierde.

**Fuentes**:

- [Expo Clipboard](https://docs.expo.dev/versions/latest/sdk/clipboard/)
- [Expo ScreenCapture](https://docs.expo.dev/versions/latest/sdk/screen-capture/)

## 10. Sistema de diseño

**Decisión**: traducir colores, espaciado, tipografía, radios y componentes de
`design/DESIGN.md` a constantes TypeScript y `StyleSheet`. Inter se incorpora
localmente con licencia mediante `expo-font`; el peso 650 se mapea a SemiBold
600. El PNG oficial se usa solo en acceso y la app bar muestra `KeyOps` como
texto hasta disponer de un símbolo compacto aprobado.

**Rationale**: evita una librería de componentes, conserva la fuente de verdad
visual y resuelve limitaciones concretas de React Native y del activo actual.

**Alternativas consideradas**:

- Librería UI: descartada por simplicidad y porque obligaría a adaptar un segundo
  sistema de tokens.
- Recortar automáticamente el logo: descartado por las reglas de marca.
- Usar solo fuente del sistema: descartado porque el diseño exige Inter.

**Fuente**: [Expo Font](https://docs.expo.dev/versions/latest/sdk/font/).

## 11. Estrategia de pruebas

**Decisión**: Jest 29.7 + `jest-expo` para dominio/integración; React Native
Testing Library 14 para comportamiento de componentes y rutas; Maestro 2.7.0
para acceso, cambio de ambiente y emisión completa. Los schemas Zod tienen
fixtures válidos, incompatibles y sin secretos. No se usa una meta porcentual ni
snapshots como evidencia principal.

**Rationale**: concentra la inversión en transiciones, permisos, ambientes,
secretos, fallos y contratos, los riesgos observables que fija la constitución.
Maestro opera sobre la interfaz accesible sin instrumentación dentro de la app.

**Alternativas consideradas**:

- Jest 30: descartado hasta que Expo 57 lo soporte oficialmente.
- `react-test-renderer` o `@testing-library/jest-native`: descartados por
  obsolescencia con React 19.
- Gran suite E2E: descartada por coste y fragilidad; reglas y variantes se cubren
  por debajo.

**Fuentes**:

- [Testing con Jest en Expo](https://docs.expo.dev/develop/unit-testing/)
- [Testing de Expo Router](https://docs.expo.dev/router/reference/testing/)
- [Maestro para React Native](https://docs.maestro.dev/platform-support/react-native)

## 12. Alcance de datos y capacidades posteriores

**Decisión**: `ManagementContext` es una proyección editable por aplicación y
ambiente con contacto y ticket; el motivo de suspensión/reactivación/revocación
pertenece al comando y al evento de auditoría. `UsageSummary` es una proyección
de solo lectura devuelta por el servicio, sin agregación local. Una credencial
revocada es terminal; una nueva emisión posterior requiere un cambio funcional
en la especificación.

P3 se conserva en contratos y estructura, pero se implementa después de P1/P2.
Coste, satisfacción y adopción del piloto se miden fuera de la app; no se añade
analítica avanzada.

**Rationale**: cierra las ambigüedades técnicas sin inventar nuevas capacidades
de negocio y respeta la prioridad de las historias.

**Alternativas consideradas**:

- Un registro de gestión local por operación: descartado porque duplicaría la
  auditoría remota y requeriría comportamiento no especificado.
- Calcular uso o métricas de piloto en el dispositivo: descartado por falta de
  autoridad de datos y alcance.

## Resultado de Phase 0

No quedan aclaraciones técnicas pendientes para diseñar el cliente. La ausencia
de contratos corporativos se resuelve mediante una frontera consumidora
versionada, schemas, fakes y adaptadores. Sigue existiendo una condición objetiva
para liberar el piloto remoto: los servicios de Pruebas deben demostrar
autenticación, autorización, atomicidad, idempotencia, entrega y auditoría según
el contrato; el móvil no puede sustituir esas garantías.
