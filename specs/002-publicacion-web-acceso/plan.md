# Implementation Plan: Publicación web móvil y acceso por perfil

**Branch**: `[002-publicacion-web-acceso]` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-publicacion-web-acceso/spec.md`

## Summary

Publicar la exportación web existente de Expo junto con una API REST versionada en un único Cloudflare Worker. El Worker autentica usuarios de demostración predefinidos, autoriza cada solicitud con permisos persistidos en Airtable y entrega sesiones breves firmadas. El cliente pasa a usar repositorios REST por defecto; el fake queda limitado a tests y desarrollo aislado.

## Technical Context

**Language/Version**: TypeScript 6.0 estricto; Node.js 25.9.0 y npm 11.12.1 fijados en `.nvmrc`, `mobile/package.json` y los lockfiles

**Primary Dependencies**: Expo SDK 57.0.12, React Native 0.86.2, React 19.2.3, Expo Router 57.0.12 y Zod 4.4.3 ya fijados en `mobile/package-lock.json`; Playwright Test 1.61.1 para el E2E web mínimo; Wrangler 4.115.0 y Vitest 4.1.10 para `worker/`; Web Crypto nativa

**Storage**: Airtable Free para usuarios y permisos no secretos; `expo-secure-store` para el token de sesión; secretos solo en Cloudflare Workers Secrets

**Testing**: Jest/jest-expo y React Native Testing Library en `mobile/`; Playwright Test para dos recorridos web; Vitest para lógica pura del Worker; pruebas REST contra un Worker local y una prueba bajo demanda contra una base Airtable de test

**Target Platform**: Navegadores móviles modernos a 390 × 844 y 360 × 800; Cloudflare Workers Free

**Project Type**: Aplicación Expo multiplataforma más API serverless y activos web estáticos en un único despliegue

**Performance Goals**: Cambio de pantalla sin polling; una única consulta de usuario por autenticación y caché breve por sesión; respuesta controlada antes del timeout del proveedor

**Constraints**: Cero secretos en el bundle; autorización remota por operación; 1.000 llamadas Airtable/mes, 5 req/s/base, 100.000 solicitudes Worker/día y 10 ms CPU/invocación; funcionamiento solo en línea

**Scale/Scope**: Cuatro perfiles y un conjunto pequeño de usuarios internos predefinidos; dos ambientes de demostración; una publicación web

## Constitution Check

*GATE: Passed before Phase 0 and re-checked after Phase 1.*

| Gate | Design evidence | Result |
|---|---|---|
| Seguridad y privacidad | PAT y clave de firma son secretos del Worker; el cliente guarda solo el token; respuestas, errores y logs se redactan | PASS |
| Mínimo privilegio | Permisos derivados del perfil en Airtable y comprobados por middleware en cada ruta | PASS |
| Auditabilidad proporcional | El acceso emite un sobre de evento que la feature 005 persiste; hasta entonces se prueba el contrato sin afirmar cumplimiento | PASS |
| Tres capas móviles | UI → casos de uso/puertos → repositorios REST; Airtable queda fuera de `mobile/` | PASS |
| Estado fiable | La sesión restaurada se valida con el Worker y el cambio de ambiente limpia estado dependiente | PASS |
| Testing verificable | Tests de permisos, sesión, rutas protegidas, viewports y una comprobación Airtable bajo demanda | PASS |
| Simplicidad y coste | Un Worker sirve API y `mobile/dist`; no se añade gestor de estado, BaaS ni hosting separado | PASS |
| Versionado | API `/v1`, Zod rechaza DTO incompatibles, dependencias bloqueadas y `compatibility_date` explícita | PASS |
| Persistencia real | Usuario habilitado y permisos se leen de Airtable en una sesión nueva; fake no es el modo de demo | PASS |

No hay violaciones constitucionales que justificar.

## Project Structure

### Documentation (this feature)

```text
specs/002-publicacion-web-acceso/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── mobile-api.openapi.yaml
└── tasks.md
```

### Source Code (repository root)

```text
mobile/
├── app/
├── src/
│   ├── composition/
│   ├── data/{http,repositories,schemas,session}/
│   ├── domain/{model,ports,use-cases}/
│   └── presentation/{controllers,state,components}/
└── tests/{unit,component,contract,integration,security,accessibility}/

worker/
├── src/
│   ├── airtable/
│   ├── auth/
│   ├── http/
│   └── routes/v1/
├── tests/{unit,contract,integration}/
├── package.json
├── package-lock.json
├── tsconfig.json
└── wrangler.jsonc
```

**Structure Decision**: Se conserva `mobile/` y sus tres capas. Se añade un único proyecto `worker/` que sirve `mobile/dist` como activos estáticos y ejecuta `/v1/*` antes del fallback SPA. La feature 002 crea la infraestructura común que reutilizan las features 003–005.

## Design Decisions

- `POST /v1/sessions` valida credenciales de demostración almacenadas como secretos del Worker y recupera el usuario habilitado y sus permisos desde Airtable.
- El Worker emite un token HMAC breve con identificador de usuario y expiración. `GET /v1/session` vuelve a comprobar estado y permisos persistentes; no se confía en permisos enviados por el cliente.
- `RestAuthRepository` y `FetchHttpClient` sustituyen al alias del fake. `createAppDependencies()` selecciona `remote` por defecto y solo permite `fake` con configuración explícita de desarrollo/test.
- `DependenciesProvider`, `SessionProvider` y `EnvironmentProvider` son el único árbol de estado compartido. Se elimina el acceso directo de `AppProvider` al fake.
- `wrangler.jsonc` usa `mobile/dist`, fallback SPA y ejecución prioritaria de `/v1/*`, de modo que publicación y API comparten origen.
- Las pantallas fuera del Sprint (usuarios y consumo) se retiran de la navegación del MVP, sin simular recorridos incompletos.

## Delivery and Validation

1. Validar permisos, expiración, redacción y rutas protegidas con tests locales.
2. Ejecutar el contrato contra `wrangler dev` con un adaptador Airtable simulado.
3. Ejecutar bajo demanda el acceso contra la base Airtable de test y restaurar sesión desde un proceso nuevo.
4. Exportar Expo Web, publicar un despliegue de preview y recorrer ambos viewports.
5. Revalidar límites gratuitos de Airtable y Cloudflare antes de la demostración.
