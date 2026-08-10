# Guía de validación local de KeyOps

**Feature**: `001-gestion-credenciales-api`

Esta guía es autocontenida: no requiere servicios remotos, Android Studio,
simuladores ni Maestro. Valida el cliente con el adaptador fake, un stub HTTP
local y la exportación Expo Web. No certifica garantías de producción.

## Prerrequisitos

- Node.js `25.9.0` y npm `11.12.1`.
- Acceso a npm para una instalación inicial de dependencias.

## 1. Preparar y comprobar

```bash
cd mobile
npm ci
node --version
npm --version
npx expo install --check
npm run doctor
```

Resultado esperado: Node muestra `v25.9.0`, npm `11.12.1`, el lockfile no se
modifica y Expo Doctor termina sin incidencias.

## 2. Validación automatizada

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run test:contract
npm run test:contract:local
npx expo export --platform web
```

Resultado esperado: todos los comandos terminan con código cero y se genera el
bundle estático en `dist/`.

## 3. Recorridos con datos sintéticos

```bash
EXPO_PUBLIC_DATA_SOURCE=fake npm run start -- --web
```

En el navegador, comprobar:

1. Acceso con `analista`, `senior`, `admin` y `auditor`; cada perfil ve solo sus
   acciones.
2. Cambio entre Pruebas y Producción sin mezclar aplicaciones.
3. Emisión para una aplicación sin credenciales y entrega con enlace y OTP
   separados.
4. Suspensión/reactivación con motivo y revocación solo para senior/admin.
5. Consulta de auditoría por senior/admin/auditor y gestión de usuarios por admin.

## Limitaciones conocidas

- No hay autenticación corporativa, API real, ZIP ni site de entrega.
- El fake/stub no prueban atomicidad real, OTP de un uso, revocación efectiva,
  IP de origen, auditoría inmutable ni retención.
- Android, iOS y Maestro deben validarse en una fase posterior con sus
  herramientas y un entorno autorizado.
