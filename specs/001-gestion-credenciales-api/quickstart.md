# Phase 1 — Guía de validación del MVP móvil

**Feature**: `001-gestion-credenciales-api`

**Uso**: ejecutar después de implementar las tareas de esta feature

Esta guía valida el cliente con el adaptador fake y, cuando exista acceso, con
el ambiente remoto de Pruebas. El fake demuestra comportamiento móvil y
contratos de cliente; no demuestra atomicidad, autorización, OTP de un uso,
auditoría inmutable ni retención del servicio.

## Prerrequisitos

- Node.js `24.19.0` LTS.
- npm `11.17.0`.
- Android Studio con emulador Android 7.0/API 24 o superior.
- Para iOS: macOS, Xcode 26.4+ y simulador iOS 16.4 o superior.
- Maestro CLI `2.7.0` y Java 17+ para E2E.
- Para integración remota: URL del ambiente de Pruebas y usuario interno de
  prueba sin datos reales sensibles.

## 1. Preparar el proyecto

Desde la raíz del repositorio:

```bash
cd mobile
npm ci
node --version
npm --version
npx expo install --check
npx expo-doctor@latest
```

Resultado esperado:

- Node muestra `v24.19.0` y npm `11.17.0`.
- `npm ci` no modifica `package-lock.json`.
- Expo no informa dependencias incompatibles con SDK 57.
- `expo-doctor` termina sin errores bloqueantes.

## 2. Validación estática y automatizada

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run test:contract
```

Resultado esperado:

- No hay errores de ESLint, TypeScript ni Jest.
- Los schemas aceptan todas las fixtures válidas y rechazan versiones, enums y
  formas incompatibles.
- Las pruebas comprueban que Client Secret, contraseña ZIP y OTP no aparecen en
  persistencia, logs, errores, snapshots ni parámetros de ruta.
- Las políticas de permiso y la máquina de estados cubren transiciones válidas
  e inválidas.

## 3. Ejecutar con datos sintéticos

La selección de adaptador se hace en composición. Solo se exponen al bundle
valores no secretos:

```bash
EXPO_PUBLIC_DATA_SOURCE=fake npm run start
```

Abrir la development build en Android y después en iOS. No usar credenciales ni
datos corporativos reales en el adaptador fake.

### Escenario A — acceso y permisos

1. Acceder con el usuario sintético `analyst.test`.
2. Confirmar que entra en KeyOps y ve inventario, detalle y acciones de analista.
3. Cerrar sesión e intentar acceso con `disabled.test`.
4. Acceder con `auditor.test`.

Resultado esperado:

- El usuario habilitado entra y solo ve acciones permitidas.
- El usuario deshabilitado recibe un mensaje seguro y persistente.
- El auditor no ve inventario operativo ni acciones sobre credenciales; puede
  entrar en auditoría cuando P2 esté implementado.
- Cerrar sesión elimina tokens y estado protegido.

### Escenario B — separación de ambientes

1. Acceder como analista y abrir Pruebas.
2. Buscar y abrir una aplicación.
3. Cambiar a Producción mientras no hay operación iniciada.
4. Simular una respuesta tardía de la consulta de Pruebas.

Resultado esperado:

- El ambiente es visible por texto y color en todas las pantallas operativas.
- El cambio vuelve al inventario, cancela solicitudes y descarta lista/detalle.
- La respuesta tardía de Pruebas no modifica Producción.
- La matriz de permisos es la misma en ambos ambientes.

### Escenario C — emisión completa

1. En Pruebas, abrir una aplicación `no_credentials`.
2. Revisar institución, aplicación, ambiente y rol.
3. Confirmar `Generar enlace de entrega`.
4. Pulsar dos veces durante el envío.
5. Copiar el OTP y compartir el enlace por separado.
6. Volver al detalle.

Resultado esperado:

- Solo se envía un comando con una clave de idempotencia.
- El resultado muestra credencial activa, fecha, auditoría, enlace y OTP en
  tarjetas separadas.
- La acción de compartir nunca incluye el OTP.
- No existe acción de descarga del ZIP ni aparece el Client Secret.
- Al vencer los dos minutos, abandonar la pantalla o pasar a segundo plano se
  oculta y limpia el contenido sensible.
- El detalle recarga el estado confirmado por el repositorio.

### Escenario D — regeneración fallida

1. Abrir la fixture con credencial activa.
2. Seleccionar `Regenerar` y confirmar.
3. Activar el fallo sintético determinista.
4. Reintentar con la misma intención lógica.

Resultado esperado:

- El error indica que la credencial anterior continúa activa.
- La UI conserva el último estado confirmado y no muestra una versión nueva.
- El error queda persistente y ofrece reintento seguro.
- El intento fallido contiene `requestId` y evidencia de auditoría fake, sin
  datos sensibles.

### Escenario E — transiciones y revocación

1. Suspender una credencial activa sin motivo y después con motivo.
2. Reactivar la credencial suspendida.
3. Acceder como analista normal y comprobar que no ve `Revocar`.
4. Acceder como analista senior, revocar con motivo y confirmar.
5. Intentar repetir la revocación.

Resultado esperado:

- Motivo es obligatorio en las tres transiciones.
- Solo se muestran acciones válidas para perfil y estado.
- La revocación requiere confirmación irreversible y queda terminal.
- El servicio/fake rechaza la repetición, aunque la UI ya no ofrezca la acción.

## 4. Ejecutar E2E críticos

Instalar una development build con el app id de KeyOps en el emulador/simulador.
Después:

```bash
maestro test .maestro/sign-in.yaml
maestro test .maestro/switch-environment.yaml
maestro test .maestro/issue-credential.yaml
```

Resultado esperado: los tres recorridos terminan correctamente en Android e
iOS. Los controles ambiguos usan `testID` estable y las aserciones visibles usan
texto/roles accesibles.

## 5. Validar el adaptador remoto de Pruebas

No guardar la URL o tokens en el repositorio. La URL no secreta puede pasarse
como variable pública y los tokens se obtienen al iniciar sesión:

```bash
EXPO_PUBLIC_DATA_SOURCE=remote \
EXPO_PUBLIC_API_BASE_URL=https://api-pruebas.example.invalid \
npm run start
```

Sustituir el dominio reservado por la URL autorizada del entorno de Pruebas.
Antes de un recorrido manual:

```bash
npm run test:contract:remote
```

El test remoto debe verificar:

1. `contractVersion = "1"` y todos los DTO pasan Zod.
2. Cada recurso operativo coincide con el ambiente de su ruta.
3. 401/403/404/409 siguen el envelope de error y no filtran causas internas.
4. Dos envíos con el mismo `Idempotency-Key` no duplican una operación.
5. Una regeneración fallida conserva la versión activa anterior.
6. Emisión/regeneración devuelven solo enlace, OTP y caducidad; nunca ZIP,
   contraseña ZIP ni Client Secret.
7. El enlace no contiene el OTP y el site rechaza OTP usado o expirado.
8. Cada operación exitosa, fallida o rechazada devuelve evidencia auditable.
9. La revocación impide el uso posterior según una comprobación del servicio.

Si falla cualquiera de los puntos 4–9, el adaptador fake puede seguir usándose
para desarrollo, pero el candidato no está listo para el piloto real.

## 6. Rendimiento y accesibilidad

Con datos representativos del piloto:

- Medir inventario y detalle desde la intención hasta el contenido estable; p95
  debe ser menor de dos segundos.
- Medir emisión y regeneración hasta respuesta confirmada; p95 debe ser menor de
  30 segundos.
- Registrar por separado tiempo de cliente y del servicio mediante `requestId`.
- Probar anchos 360, 390 y 430 px y tablet con contenido máximo de 600 px.
- Probar texto al 200 %, lector de pantalla, teclado externo, movimiento reducido
  y contraste WCAG AA.
- Verificar que el teclado no oculta errores ni la acción principal y que todas
  las áreas táctiles alcanzan 48 × 48 px.

## 7. Evidencia de cierre

Conservar en el resultado de la tarea de implementación:

- versiones de Node/npm y `expo-doctor`;
- salida de lint, typecheck, Jest y contrato;
- plataforma y resultado de cada flujo Maestro;
- mediciones p95 con tamaño de muestra;
- incidencias conocidas o contratos remotos no demostrados.

No es evidencia suficiente una captura de pantalla aislada ni un recorrido solo
con el adaptador fake.
