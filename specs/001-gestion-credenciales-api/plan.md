# Plan de implementación: Gestión autónoma de credenciales API

**Feature**: `001-gestion-credenciales-api`

**Rama Git actual**: `main`

**Fecha**: 2026-08-10

**Especificación**: [spec.md](./spec.md)

**Diseño**: [DESIGN.md](../../design/DESIGN.md)

**Constitución**: [constitution.md](../../.specify/memory/constitution.md)

**Input**: especificación de feature en
`/specs/001-gestion-credenciales-api/spec.md`.

## Resumen

KeyOps se construirá y validará localmente con Expo Web. El cliente implementará
tres capas —presentación, dominio y datos— y una frontera REST/JSON versionada
con un adaptador fake determinista. Un stub HTTP local probará el contrato sin
presentar esas simulaciones como garantías de producción.

La entrega se realizará en cortes verticales: primero la base técnica,
autenticación y separación de ambientes; después inventario y detalle; a
continuación el ciclo de vida P1 completo; luego las capacidades P2 y, por
último, la administración P3. La auditoría, autorización remota y separación de
Pruebas/Producción se incorporan desde el primer corte y no como endurecimiento
posterior.

## Contexto técnico

**Lenguaje/versión**: TypeScript `~6.0.3` en modo estricto; Node.js `25.9.0`;
npm `11.12.1`, las versiones disponibles en la máquina de construcción.

**Dependencias principales**: Expo SDK 57; React Native `0.86.x`; React
`19.2.3`; Expo Router `~57.0.x` con rutas tipadas; Zod 4.x; `expo-secure-store`,
`expo-font`, `expo-clipboard` y `expo-screen-capture` en sus versiones
compatibles con SDK 57; `fetch` y `Share` de la plataforma.

**Persistencia**: sin base de datos local. SecureStore conserva exclusivamente
los tokens de sesión. En este candidato, inventario, detalle, permisos y
resultados operativos se mantienen en memoria y se reconstruyen desde el fake.

**Testing**: Jest `29.7.x` con `jest-expo ~57.0.x`, React Native Testing Library
14.x, pruebas de contrato sobre schemas Zod, stub HTTP local y exportación Expo
Web. No se exige Maestro ni un simulador.

**Plataforma de validación**: Expo Web local, orientación vertical y anchos de
360–430 px. Android e iOS quedan fuera de la evidencia de este repositorio.

**Objetivos de rendimiento**: inventario y detalle disponibles en menos de dos
segundos en el 95 % de los casos; emisión y regeneración en menos de 30
segundos; interacción fluida a 60 fps en lista, formularios y transiciones. Las
mediciones serán de extremo a extremo y distinguirán tiempo de cliente y de
servicio.

**Restricciones**: operaciones críticas solo en línea; sin éxito optimista ni
colas offline; ambiente explícito en cada consulta y comando; Client Secret,
contraseña ZIP y OTP fuera de persistencia, rutas, logs y analítica; el móvil no
descarga el ZIP; idioma español; WCAG AA, texto escalable al 200 % y objetivos
táctiles mínimos de 48 × 48 px.

**Escala/alcance**: 14 historias, 19 requisitos funcionales, cuatro perfiles,
dos ambientes, cinco estados visibles de credencial y siete rutas de pantalla
principales. El repositorio contiene solo el cliente móvil y la documentación;
no incluye el site de entrega ni los servicios remotos.

### Versiones gobernadas

| Componente   | Versión inicial     | Regla de actualización                                                  |
| ------------ | ------------------- | ----------------------------------------------------------------------- |
| Node.js      | `25.9.0`            | Fijado en `.nvmrc` y `engines`; runtime disponible localmente.          |
| npm          | `11.12.1`           | Fijado en `packageManager`; instalaciones reproducibles con `npm ci`.   |
| Expo         | SDK `57`            | Crear con `default@sdk-57`; no usar canary ni beta.                     |
| React Native | `0.86.x`            | La versión exacta la resuelve el template de Expo 57.                   |
| React        | `19.2.3`            | La versión exacta la resuelve el template de Expo 57.                   |
| TypeScript   | `~6.0.3`            | TypeScript 7 queda fuera hasta verificar compatibilidad con Expo/Jest.  |
| Expo Router  | `~57.0.x`           | Instalar y comprobar con `npx expo install --check`.                    |
| Módulos Expo | familia SDK 57      | Instalar con `npx expo install`; el lockfile fija cada parche.          |
| Jest / RNTL  | `29.7.x` / `14.x`   | Mantener la combinación soportada por Expo 57 y React 19.               |
| E2E nativo   | No aplica           | La validación se limita a Jest, stub local y exportación web.           |
| API móvil    | `/v1`, contrato `1` | Un cambio incompatible exige `/v2` o compatibilidad temporal explícita. |

`package-lock.json` será la evidencia de las versiones exactas finalmente
resueltas. Antes de aceptar una actualización se ejecutarán `expo-doctor`,
typecheck, pruebas, contrato contra stub local y exportación web.

## Comprobación de la constitución

_GATE: debe pasar antes de Phase 0 y se reevalúa tras Phase 1._

| Principio                  | Evidencia prevista                                                                            | Pre-diseño | Post-diseño |
| -------------------------- | --------------------------------------------------------------------------------------------- | ---------- | ----------- |
| I. Seguridad               | Secretos emitidos en servicio remoto; OTP/enlace solo en memoria; sin descarga móvil.         | PASA       | PASA        |
| II. Mínimo privilegio      | Política local de visibilidad y reautorización del servidor en cada endpoint.                 | PASA       | PASA        |
| III. Auditabilidad         | Cada respuesta incluye correlación y evidencia de auditoría; el servidor registra actor e IP. | PASA       | PASA        |
| IV. Privacidad             | Schemas sin Client Secret/contraseña ZIP; limpieza al caducar, salir o ir a segundo plano.    | PASA       | PASA        |
| V. Spec/plan               | Este documento solo decide el cómo y no altera comportamiento de `spec.md`.                   | PASA       | PASA        |
| VI. Tres capas             | UI → casos de uso/puertos ← adaptadores de datos, unidos en composición.                      | PASA       | PASA        |
| VII. Estado confiable      | Servidor como fuente de verdad, estado unidireccional y operaciones online sin optimismo.     | PASA       | PASA        |
| VIII. Testing proporcional | Unitarias de dominio, componentes, contratos y tres recorridos E2E críticos.                  | PASA       | PASA        |
| IX. Simplicidad            | Sin Redux, base local, BFF en este repo, librería UI ni código nativo personalizado.          | PASA       | PASA        |
| X. Versiones               | Runtime, SDK, tooling y API fijados; dependencias exactas en lockfile.                        | PASA       | PASA        |

Esta variante local no puede certificar garantías de producción. El fake y el
stub prueban que el cliente interpreta el contrato y sus errores de forma
consistente, pero no demuestran atomicidad, OTP de un uso, revocación efectiva,
auditoría inmutable ni retención de cinco años.

## Estructura del proyecto

### Documentación de esta feature

```text
specs/001-gestion-credenciales-api/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── mobile-api.openapi.yaml
└── tasks.md                    # Phase 2; lo generará speckit-tasks
```

### Código fuente

```text
mobile/
├── app.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── assets/
│   ├── fonts/                  # Inter con licencia incluida
│   └── images/                 # Copia optimizada de design/logo.png
├── src/
│   ├── app/                    # Rutas Expo Router, sin red ni storage
│   │   ├── _layout.tsx
│   │   ├── (auth)/sign-in.tsx
│   │   └── (protected)/
│   │       ├── _layout.tsx
│   │       ├── applications/
│   │       │   ├── index.tsx
│   │       │   └── [applicationId]/
│   │       │       ├── index.tsx
│   │       │       └── operation.tsx
│   │       ├── audit/index.tsx
│   │       └── users/
│   │           ├── index.tsx
│   │           └── [userId].tsx
│   ├── presentation/
│   │   ├── components/
│   │   ├── controllers/
│   │   ├── design-system/
│   │   └── state/
│   ├── domain/
│   │   ├── model/
│   │   ├── policies/
│   │   ├── ports/
│   │   └── use-cases/
│   ├── data/
│   │   ├── http/
│   │   ├── schemas/
│   │   ├── mappers/
│   │   ├── repositories/
│   │   ├── session/
│   │   └── fake/
│   └── composition/
├── tests/
│   ├── unit/
│   ├── component/
│   ├── contract/
│   ├── integration/
│   └── fixtures/
```

**Decisión estructural**: la app vive en `mobile/` porque el repositorio ya
contiene documentación pública y artefactos Spec Kit en la raíz. Expo Router
usa `mobile/src/app`; los ficheros de ruta son adaptadores finos y no contienen
lógica de negocio. No se versionan directorios `ios/` o `android/` mientras no
exista una necesidad nativa justificada.

## Arquitectura y flujo de datos

```text
Pantalla / ruta
      ↓ intención                 ↑ estado inmutable
Controlador de presentación (hook + useReducer)
      ↓
Caso de uso de dominio
      ↓ depende de un puerto
Repositorio de dominio
      ↑ implementa
Stub HTTP local + Zod  ───── o ───── Adaptador fake sintético
      ↓
Datos sintéticos locales
```

`createAppDependencies(config)` construye una sola vez el grafo de objetos y lo
expone mediante `DependenciesProvider`. La composición fake y el stub local
comparten puertos; pantallas, controladores y casos de uso no instancian
repositorios ni importan `fetch` o SecureStore.

`SessionProvider` contiene usuario y vigencia de sesión; `EnvironmentProvider`
contiene únicamente el ambiente activo. El estado de lista, detalle y operación
es local a la pantalla. Cada caso de uso recibe `environment` explícitamente.

La búsqueda del inventario usa un único `query` controlado por la pantalla y lo
entrega al caso de uso de listado. El adaptador normaliza mayúsculas y acentos y
compara una lista explícita de campos autorizados —identificadores, aplicación,
institución, rol, contacto, ticket, Client ID, estado, IP y actores del historial—
para impedir que campos sensibles presentes en futuras respuestas entren en el
índice por accidente. El fake filtra en memoria; el adaptador REST envía el mismo
`query` al servicio para que paginación y búsqueda se resuelvan sobre el conjunto
completo en un entorno real.

Al cambiar de ambiente se cancelan las solicitudes mediante `AbortController`,
se descarta el estado dependiente y se vuelve al inventario. Un identificador de
solicitud evita que una respuesta tardía del ambiente anterior rehidrate la UI.

Las operaciones críticas usan una máquina de pantalla
`idle → confirming → submitting → succeeded | failed`. El botón queda bloqueado
durante `submitting`; cada intento lleva `Idempotency-Key`; no se cambia el
estado de dominio hasta recibir y validar la respuesta. Un fallo conserva la
última proyección confirmada y muestra un error persistente con reintento seguro.

## Integración y contratos

La app consume el contrato lógico definido en
[mobile-api.openapi.yaml](./contracts/mobile-api.openapi.yaml). Aunque los
servicios corporativos estén separados físicamente, esa fragmentación queda
detrás de los adaptadores de datos y no alcanza a dominio o presentación. Este
repositorio no construye un backend ni el site externo de descarga.

Decisiones de contrato:

- HTTPS, JSON, Bearer token y rutas versionadas bajo `/v1`.
- Ambiente incluido en la ruta de todo recurso operativo.
- `Idempotency-Key` obligatorio en emisión, regeneración, entrega y cambios de
  estado.
- Fechas RFC 3339 UTC, identificadores opacos y errores normalizados con
  `requestId`, `retryable` y evidencia de auditoría.
- Schemas Zod reflejan el OpenAPI; una versión, enum o forma incompatibles se
  rechazan antes de entrar en dominio.
- La respuesta móvil de entrega contiene solo `deliveryUrl`, OTP y caducidad.
  Nunca contiene ZIP, contraseña ZIP ni Client Secret.
- Actor, IP, hora, atomicidad y evento de auditoría los determina el servicio;
  el cliente no los envía como datos fiables.

Para desarrollo y validación local, `Fake*Repository` implementa los puertos y
cubre todos los estados con datos sintéticos. Un stub HTTP local verifica los
DTO y errores definidos en el OpenAPI.

## Seguridad y datos sensibles

- SecureStore guarda solo access/refresh token; al cerrar sesión o recibir 401
  se eliminan ambos y se descarta el grafo de estado protegido.
- El Client Secret y la contraseña ZIP no existen en los tipos, DTO ni fixtures
  del cliente.
- OTP y enlace permanecen en el estado en memoria de la operación; no viajan en
  parámetros de ruta. La vista de resultado es un estado de la misma ruta.
- La pantalla de entrega bloquea capturas con `expo-screen-capture`, oculta el
  contenido al pasar a segundo plano y lo limpia al vencer el OTP, cancelar o
  abandonar el flujo.
- Copiar el OTP es una acción explícita. Al caducar se vacía el portapapeles; la
  acción de compartir contiene únicamente el enlace.
- El cliente HTTP redacta `Authorization`, OTP, URL de entrega y cuerpos de
  comandos antes de cualquier log de desarrollo. Producción no registra cuerpos.
- Revocación exige perfil permitido, motivo y confirmación irreversible. La
  autorización definitiva sigue siendo del servicio.

## Sistema de diseño y accesibilidad

Los tokens de `design/DESIGN.md` se traducen a constantes TypeScript y estilos
`StyleSheet`; los nombres de token nunca aparecen como texto. Inter se incorpora
como fuente local mediante `expo-font` y los pesos 650 se normalizan a SemiBold 600. La app usa una columna, una acción primaria por pantalla, zonas táctiles de
48 px, safe areas y estados carga/vacío/error persistentes.

Pruebas y Producción mantienen colores y texto diferenciados en todas las
pantallas. Producción añade aviso y confirmación reforzada. Las acciones no
autorizadas se omiten, y el color nunca es el único indicador. La app permite
font scaling hasta 200 %, foco visible, etiquetas accesibles y movimiento
reducido.

En acceso se usa `design/logo.png`. En la app bar se muestra `KeyOps` como texto
hasta disponer de un símbolo compacto aprobado; no se recorta el PNG original.

## Orden de construcción

### 0. Base reproducible y frontera técnica

1. Crear `mobile/` con el template estable Expo SDK 57 y npm.
2. Fijar Node/npm, lockfile, TypeScript estricto, ESLint, Prettier, Jest y scripts
   `lint`, `typecheck`, `test`, `test:contract` y `doctor`.
3. Configurar `src/app`, rutas tipadas, identificadores de app, exportación web
   y composición fake.
4. Traducir tokens de diseño, cargar Inter y construir los componentes base
   accesibles.
5. Implementar puertos, cliente HTTP, schemas Zod, mappers, fakes y sesión
   SecureStore antes de las pantallas operativas.

### 1. Corte P1 de acceso y contexto seguro

Implementar US-01 y US-13: acceso, restauración/caducidad de sesión, protección
de rutas, permisos, selector Pruebas/Producción y descarte de estado al cambiar.
Validar el flujo y el contrato de sesión con datos sintéticos y stub local.

### 2. Corte P1 de consulta

Implementar US-02 y US-03: inventario paginado, búsqueda, filtros, ordenación,
detalle, historial y acciones calculadas por perfil/estado. Client Secret queda
ausente por construcción. Este corte establece los estados de carga, vacío,
error y reintento reutilizados por el resto.

### 3. Primer flujo crítico vertical

Implementar US-04 de extremo a extremo: confirmación, emisión/activación,
resultado, enlace y OTP separados, auditoría y vuelta al detalle. Este flujo
valida arquitectura, idempotencia, protección de secretos y site de entrega
antes de multiplicar operaciones.

### 4. Ciclo de vida P1 completo

Añadir US-05, US-06 y US-07 en este orden: regeneración atómica; suspensión y
reactivación con motivo; revocación irreversible. US-08 se verifica en cada
operación exitosa, fallida o rechazada y se cierra transversalmente al terminar
P1, no mediante una pantalla separada.

### 5. Capacidades P2

Añadir US-09, US-10, US-11 y US-12: nueva entrega sin descarga local; contexto
operativo; consulta de uso; consulta y filtros de auditoría. Cada capacidad se
conecta mediante su puerto sin ampliar el estado global.

### 6. Administración P3

Implementar US-14 solo después de estabilizar el piloto: lista, alta,
modificación, perfil y habilitación de usuarios. Reutiliza permisos, errores,
paginación y auditoría; no crea una cuarta capa ni un segundo proyecto.

### 7. Validación del candidato local

Ejecutar `expo-doctor`, lint, typecheck, unitarias, componentes, contratos contra
stub local y `expo export --platform web`. Validar accesibilidad, ausencia de
secretos, separación de ambientes y tiempos locales. La distribución nativa y
la validación de piloto requieren una fase posterior con sus entornos reales.

## Estrategia de pruebas

| Nivel       | Riesgo cubierto                                                                         | Evidencia principal                                                |
| ----------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Unitarias   | Permisos, transiciones, motivo, ambientes, errores e idempotencia local.                | Casos de uso y políticas TypeScript puras con repositorios falsos. |
| Componentes | Carga/vacío/error, acciones por rol, confirmaciones, accesibilidad y secretos ausentes. | React Native Testing Library por comportamiento observable.        |
| Contrato    | DTO/versiones incompatibles, errores, ambiente, redacción y mappers.                    | Fixtures válidos/inválidos contra Zod y OpenAPI.                   |
| Integración | Sesión SecureStore, 401/403, timeout, cancelación y cambio de adaptador.                | Repositorios reales con HTTP simulado en el límite.                |
| Web         | El bundle se genera sin errores.                                                        | `npx expo export --platform web`.                                  |

No se fija cobertura porcentual. Una regresión de regeneración fallida debe
existir como prueba de caso de uso y componente.

## Trazabilidad de requisitos

| Prioridad | Historia | Requisitos                             | Corte técnico                             |
| --------- | -------- | -------------------------------------- | ----------------------------------------- |
| P1        | US-01    | FR-001, FR-002, FR-013                 | Autenticación, sesión y rutas protegidas. |
| P1        | US-13    | FR-018                                 | Ambiente explícito y descarte de estado.  |
| P1        | US-02    | FR-003, FR-004, FR-013, FR-018         | Inventario y consultas por ambiente.      |
| P1        | US-03    | FR-005, FR-006, FR-013, FR-018         | Detalle y política de acciones.           |
| P1        | US-04    | FR-007, FR-008, FR-010, FR-013, FR-018 | Emisión y entrega externa.                |
| P1        | US-05    | FR-008, FR-009, FR-010, FR-013, FR-018 | Rotación y fallo seguro.                  |
| P1        | US-06    | FR-011, FR-013, FR-018                 | Transiciones temporales con motivo.       |
| P1        | US-07    | FR-012, FR-013, FR-018                 | Revocación y autorización.                |
| P1        | US-08    | FR-013                                 | Auditoría remota transversal.             |
| P2        | US-09    | FR-016, FR-013, FR-018                 | Nueva entrega sin descarga móvil.         |
| P2        | US-10    | FR-014, FR-013, FR-018                 | Contexto de gestión.                      |
| P2        | US-11    | FR-017, FR-013, FR-018                 | Proyección de uso.                        |
| P2        | US-12    | FR-015, FR-018                         | Consulta autorizada de auditoría.         |
| P3        | US-14    | FR-001, FR-013, FR-019                 | Administración de usuarios y perfiles.    |

## Compatibilidad, migración y riesgos

- **Servicios sin contrato publicado**: el OpenAPI es la frontera local. El
  stub valida la forma de sus respuestas; las garantías remotas quedan fuera
  del alcance de este candidato local.
- **Autenticación corporativa**: el dominio depende de `AuthRepository`; el
  contrato inicial usa sesión Bearer compatible con el formulario aprobado. Un
  proveedor SSO futuro sustituye solo el adaptador y la pantalla de acceso.
- **Site de entrega externo**: el móvil consume una URL sintética; construir u
  operar el site queda fuera de este candidato local.
- **Soporte de dispositivos**: Android e iOS no se validan en esta máquina. La
  exportación web es el límite verificable del candidato local.
- **Spec aún rotulada como borrador**: la petición explícita de planificación
  fija esta versión como baseline técnica. Cambios funcionales posteriores
  vuelven a `spec.md` y requieren analizar impacto antes de tocar el plan.
- **P3 diferido**: FR-019 se implementa después del piloto P1/P2. El mecanismo
  corporativo existente puede administrar usuarios mientras tanto, sin crear
  una UI provisional no especificada.
- **Métricas de piloto**: tiempo se instrumenta con correlación de operación;
  coste, satisfacción y adopción se calculan fuera de la app. No se añade
  analítica avanzada porque está fuera del alcance funcional.

## Seguimiento de complejidad

No hay violaciones constitucionales ni complejidad excepcional que justificar.
La carpeta `mobile/`, los puertos de dominio, el fake y el stub existen para
permitir validación sintética, no como proyectos o capas adicionales.
