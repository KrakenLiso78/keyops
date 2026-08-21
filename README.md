# KeyOps

Plataforma para gestionar de forma segura, autónoma y auditable el ciclo de vida de credenciales API.

KeyOps permite a analistas autorizados consultar aplicaciones, generar y renovar credenciales, gestionar sus estados, consultar su uso y mantener la trazabilidad de las operaciones realizadas.

## Estado del proyecto

El repositorio contiene un candidato móvil Expo Web funcional, una especificación pública organizada con GitHub Spec-Kit y adaptadores para ejecutar la aplicación con datos fake o contra una API remota.

La validación reproducible disponible en este repositorio es local y usa el modo fake. No certifica todavía un backend real, proveedores externos, entrega ZIP/OTP real, Android ni iOS.

## Modos de funcionamiento

La aplicación tiene dos decisiones de configuración independientes.

### 1. Fuente de datos de la aplicación

Se controla con `EXPO_PUBLIC_DATA_SOURCE`:

| Valor | Comportamiento |
| --- | --- |
| `fake` | Usa repositorios locales en memoria, sin llamadas de red. Es el modo recomendado para demos, desarrollo de interfaz y validación reproducible. Incluye datos semilla representativos, usuarios fake, operaciones de credenciales, recibos y auditoría sintéticos. |
| `remote` | Usa los adaptadores REST de la aplicación (`Auth`, `Application`, `Credential`, `Audit` y `User`) y el `EXPO_PUBLIC_API_BASE_URL` configurado. Requiere un servicio remoto compatible con los contratos publicados. |

El modo `fake` local no crea credenciales reales ni envía un ZIP o un OTP real. Los identificadores, recibos, URLs de entrega y eventos de auditoría son sintéticos y sirven para ejercitar los flujos de la aplicación. Sus cambios viven en memoria del proceso y se pierden al reiniciar la aplicación.

Usuarios disponibles en el seed local:

- `analista` — perfil de analista.
- `senior` — perfil de analista sénior.
- `admin` — perfil administrador.
- `auditor` — perfil auditor.

El seed contiene 24 aplicaciones (12 de pruebas y 12 de producción) y cuatro usuarios con perfiles diferenciados.

### 2. Modo del Worker cuando la fuente es remota

Cuando `EXPO_PUBLIC_DATA_SOURCE=remote`, el backend informa del modo del Worker mediante `/v1/health`:

| Modo del Worker | Comportamiento |
| --- | --- |
| `fake` | Usa los datos persistentes de demostración configurados en el servicio remoto. |
| `real` | Usa exclusivamente los proveedores externos configurados; la aplicación no debe mostrar datos fake como fallback. |

Un administrador puede consultar y cambiar este modo desde **Aplicaciones → menú → Modo de operación**. La acción guarda la configuración mediante `/v1/runtime-configuration`, recarga mediante `/v1/runtime-configuration/reload` y vuelve a cargar el inventario. En modo `fake`, el administrador también puede solicitar **Restablecer datos semilla** mediante `/v1/fake/reset`.

Este selector remoto no cambia `EXPO_PUBLIC_DATA_SOURCE`: controla el Worker del servicio, no los repositorios de la aplicación. Las garantías del modo remoto dependen del backend y de los proveedores conectados.

## Configuración

La configuración se valida al arrancar mediante un esquema tipado. Parte de `mobile/.env.example`:

```bash
cd mobile
cp .env.example .env
```

### Demo local fake (recomendada para probar el repositorio)

```dotenv
EXPO_PUBLIC_DATA_SOURCE=fake
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_AUTH_MODE=credentials
```

### API remota

```dotenv
EXPO_PUBLIC_DATA_SOURCE=remote
EXPO_PUBLIC_API_BASE_URL=http://localhost:8787
EXPO_PUBLIC_AUTH_MODE=credentials
```

`EXPO_PUBLIC_AUTH_MODE` admite:

- `credentials`: acceso mediante identificador de credenciales.
- `corporate`: acceso mediante el flujo de identidad corporativa configurado por el servicio remoto.

Las variables `EXPO_PUBLIC_*` se incorporan al cliente Expo. No deben contener secretos, tokens privados, claves de proveedor ni credenciales de producción. La aplicación conserva la sesión mediante `expo-secure-store`, pero eso no convierte una variable pública en un secreto.

## Ejecutar la aplicación

```bash
cd mobile
npm install
npm run web       # Expo Web
# npm start       # selector de plataforma de Expo
# npm run ios     # simulador iOS
# npm run android # emulador Android
```

Antes de usar `remote`, comprueba que la API esté accesible desde el dispositivo o navegador y que implemente los contratos de `specs/*/contracts/`.

## Funcionalidades implementadas

- Inicio y cierre de sesión con repositorio fake o REST.
- Selector visible de ambiente **PRUEBAS** / **PRODUCCIÓN**, con aviso reforzado en producción.
- Listado, búsqueda y filtrado de aplicaciones por estado de credencial.
- Detalle de aplicación, contacto técnico, ticket, IPs declaradas y contexto de gestión.
- Consulta de uso: mensajes, servicios consumidos, IPs utilizadas y última actividad cuando existe información.
- Ciclo de vida de credenciales: emitir, regenerar, suspender, reactivar, revocar y preparar entrega.
- Motivo obligatorio para suspender, reactivar o revocar.
- Recibos operativos con `operationId`, `requestId`, resultado y evento de auditoría.
- Auditoría funcional y administración de usuarios autorizados según perfil.
- Integración de catálogo corporativo mediante adaptador REST cuando el servicio remoto está disponible.
- Diseño responsive Expo Web, componentes accesibles y pruebas de navegación web.

## Validación

Desde `mobile/`:

```bash
npm run validate             # doctor, lint, formato, tipos, Jest, contrato local y export web
npm test -- --runInBand      # pruebas unitarias, componentes e integración
npm run test:contract:local  # contrato contra stub HTTP local
npm run test:e2e             # Playwright
npm run export:web           # exportación web
```

La evidencia y sus límites están documentados en:

- [Validación local](mobile/docs/validation/README.md)
- [Validación final](mobile/docs/validation/final.md)
- [Contrato local](mobile/docs/validation/local-contract.md)
- [Exportación web](mobile/docs/validation/web-export.md)

## Especificación pública y planificación

El entregable completo solicitado está disponible en:

- [Spec raíz completo](spec.md)
- [Índice de specs](specs/README.md)
- [Feature 001 — Gestión de credenciales API](specs/001-gestion-credenciales-api/spec.md)
- [Plan de la feature 001](specs/001-gestion-credenciales-api/plan.md)
- [Tareas de la feature 001](specs/001-gestion-credenciales-api/tasks.md)
- [Contrato OpenAPI móvil](specs/001-gestion-credenciales-api/contracts/mobile-api.openapi.yaml)

Las features posteriores se encuentran en `specs/002-*` a `specs/010-*`, cada una con su especificación, plan, tareas y contratos o modelo de datos cuando aplica.

## Diseño y documentación de producto

- [Sistema de diseño](design/DESIGN.md)
- [Historias de usuario](docs/product/historias-de-usuario-keyops.docx)
- [Lean Canvas](docs/product/keyops-lean-canvas.pptx)
- [Vídeo de producto](docs/product/KeyOps_LIve_v1.MP4.mp4)
- [Evidencia y notas del sprint](Post_Sprint3.txt)

## Estructura del repositorio

```text
keyops/
├── README.md
├── AGENTS.md
├── spec.md
├── Post_Sprint3.txt
├── design/                         # sistema de diseño, pantallas y entregables visuales
├── docs/product/                   # historias, Lean Canvas y vídeo
├── mobile/
│   ├── .env.example                # configuración runtime
│   ├── src/                        # dominio, UI, repositorios fake y REST
│   ├── tests/                      # unitarias, componentes, contrato, integración y E2E
│   └── docs/validation/            # evidencia reproducible y limitaciones
└── specs/
    ├── README.md
    ├── 001-gestion-credenciales-api/
    │   ├── spec.md
    │   ├── plan.md
    │   ├── tasks.md
    │   └── contracts/
    └── 002-* … 010-*               # features posteriores Spec-Kit
```

## Metodología

KeyOps adopta un enfoque de desarrollo dirigido por especificaciones —Spec-Driven Development— basado en [GitHub Spec-Kit](https://github.com/github/spec-kit).

El flujo aplicado es:

1. **Constitution** — Establecer principios y límites del proyecto.
2. **Specify** — Definir qué debe resolver el producto y por qué.
3. **Clarify / Checklist** — Resolver ambigüedades y comprobar la calidad del spec cuando aplica.
4. **Plan** — Diseñar el enfoque técnico sin mezclarlo con el comportamiento requerido.
5. **Tasks** — Convertir el plan en tareas pequeñas, ordenadas y verificables.
6. **Analyze** — Revisar la coherencia entre spec, plan y tareas.
7. **Implement** — Construir, probar y documentar la solución.

## Proyecto

Proyecto desarrollado en el contexto de VIBERANO'26.
