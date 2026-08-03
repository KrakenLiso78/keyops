---
version: "1.0"
status: final
name: "KeyOps Mobile Design System"
product: "KeyOps"
platform: "Aplicación móvil"
language: "es"
description: >
  Sistema de diseño final para KeyOps, una aplicación móvil interna que permite
  a analistas autorizados consultar aplicaciones y tramitar de forma segura el
  ciclo de vida de credenciales API. Conserva la identidad navy, morada y
  turquesa de la propuesta visual aprobada, con tarjetas claras, acentos
  geométricos y una interfaz vertical optimizada para el uso con el dedo.

assets:
  logo-primary:
    path: "./logo.png"
    repositoryPath: "design/logo.png"
    format: "PNG"
    dimensions: "2816x1536"
    composition: "Símbolo y logotipo KeyOps sobre fondo blanco texturizado"
    altText: "KeyOps"
    intendedUse: "Acceso, documentación y presentaciones"

colors:
  primary: "#5645d4"
  primary-pressed: "#4534b3"
  primary-deep: "#3a2a99"
  on-primary: "#ffffff"

  brand-navy: "#0a1530"
  brand-navy-deep: "#070f24"
  brand-navy-mid: "#1a2a52"
  brand-cyan: "#12b8c8"
  brand-teal: "#2a9d99"

  link-blue: "#0075de"
  link-blue-pressed: "#005bab"

  brand-orange: "#dd5b00"
  brand-orange-deep: "#793400"
  brand-pink: "#ff64c8"
  brand-purple: "#7b3ff2"
  brand-purple-300: "#d6b6f6"
  brand-purple-800: "#391c57"
  brand-green: "#1aae39"
  brand-yellow: "#f5d75e"

  card-tint-peach: "#ffe8d4"
  card-tint-rose: "#fde0ec"
  card-tint-mint: "#d9f3e1"
  card-tint-lavender: "#e6e0f5"
  card-tint-sky: "#dcecfa"
  card-tint-yellow: "#fef7d6"
  card-tint-gray: "#f0eeec"

  canvas: "#ffffff"
  surface: "#f6f5f4"
  surface-soft: "#fafaf9"
  hairline: "#e5e3df"
  hairline-soft: "#ede9e4"
  hairline-strong: "#c8c4be"

  ink-deep: "#000000"
  ink: "#1a1a1a"
  charcoal: "#37352f"
  slate: "#5d5b54"
  steel: "#787671"
  muted: "#a4a097"
  on-dark: "#ffffff"
  on-dark-muted: "#d5d7dc"

  semantic-success: "#168a2f"
  semantic-success-soft: "#d9f3e1"
  semantic-warning: "#b54708"
  semantic-warning-soft: "#fef0c7"
  semantic-error: "#c62828"
  semantic-error-soft: "#fde0ec"
  semantic-info: "#0075de"
  semantic-info-soft: "#dcecfa"

  environment-test: "#5645d4"
  environment-test-soft: "#e6e0f5"
  environment-production: "#c62828"
  environment-production-soft: "#fde0ec"

typography:
  heading-1:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.5px"
  heading-2:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 26px
    fontWeight: 700
    lineHeight: 1.22
    letterSpacing: "-0.3px"
  heading-3:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 22px
    fontWeight: 650
    lineHeight: 1.28
    letterSpacing: "-0.2px"
  heading-4:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 18px
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: 0
  subtitle:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
  body-md:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.50
    letterSpacing: 0
  body-md-medium:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.50
    letterSpacing: 0
  body-sm:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: 0
  body-sm-medium:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: 0
  caption:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.40
    letterSpacing: 0
  caption-bold:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 13px
    fontWeight: 650
    lineHeight: 1.40
    letterSpacing: 0
  micro:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.40
    letterSpacing: 0
  code:
    fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.50
    letterSpacing: 0
  button-md:
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: 15px
    fontWeight: 650
    lineHeight: 1.20
    letterSpacing: 0

rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  xxl: 20px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 40px

elevation:
  flat: "none"
  card: "0 1px 3px rgba(10, 21, 48, 0.10)"
  overlay: "0 12px 32px rgba(10, 21, 48, 0.18)"

motion:
  fast: "120ms"
  standard: "200ms"
  slow: "320ms"
  easing: "cubic-bezier(0.2, 0, 0, 1)"

components:
  brand-logo:
    asset: "{assets.logo-primary.path}"
    altText: "{assets.logo-primary.altText}"
    backgroundColor: "{colors.canvas}"
    recommendedWidthMobile: 200px
    minimumWidth: 144px
    maximumWidth: 240px

  app-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    height: 56px
    padding: "0 {spacing.md}"
    border: "0 0 1px {colors.hairline} solid"

  environment-tabs:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.steel}"
    activeTextColor: "{colors.ink}"
    activeIndicatorColor: "{colors.primary}"
    height: 44px

  environment-production-alert:
    backgroundColor: "{colors.environment-production-soft}"
    textColor: "{colors.environment-production}"
    typography: "{typography.caption-bold}"
    height: 32px

  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    height: 48px
    padding: "0 {spacing.lg}"
  button-primary-pressed:
    backgroundColor: "{colors.primary-pressed}"
    textColor: "{colors.on-primary}"
  button-primary-disabled:
    backgroundColor: "{colors.hairline}"
    textColor: "{colors.muted}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    height: 48px
    padding: "0 {spacing.lg}"
    border: "1px solid {colors.hairline-strong}"
  button-danger:
    backgroundColor: "{colors.semantic-error}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    height: 48px
    padding: "0 {spacing.lg}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.md}"
    height: 48px
    padding: "0 {spacing.md}"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: 48px

  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "0 {spacing.md}"
    border: "1px solid {colors.hairline-strong}"
    height: 48px
  text-input-focused:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    border: "2px solid {colors.primary}"
  text-area:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    border: "1px solid {colors.hairline-strong}"
    minHeight: 104px

  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.steel}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "0 {spacing.md}"
    height: 48px
    border: "1px solid {colors.hairline}"

  application-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    border: "1px solid {colors.hairline}"
    shadow: "{elevation.card}"

  credential-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    border: "1px solid {colors.hairline}"
    shadow: "{elevation.card}"

  delivery-link-card:
    backgroundColor: "{colors.card-tint-sky}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    border: "1px solid {colors.hairline}"

  otp-card:
    backgroundColor: "{colors.card-tint-lavender}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    border: "1px solid {colors.hairline}"

  information-card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
    border: "1px solid {colors.hairline}"

  warning-card:
    backgroundColor: "{colors.semantic-warning-soft}"
    textColor: "{colors.semantic-warning}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"

  error-card:
    backgroundColor: "{colors.semantic-error-soft}"
    textColor: "{colors.semantic-error}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"

  badge-role:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-active:
    backgroundColor: "{colors.semantic-success-soft}"
    textColor: "{colors.semantic-success}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-suspended:
    backgroundColor: "{colors.semantic-warning-soft}"
    textColor: "{colors.semantic-warning}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-revoked:
    backgroundColor: "{colors.semantic-error-soft}"
    textColor: "{colors.semantic-error}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-no-credentials:
    backgroundColor: "{colors.card-tint-gray}"
    textColor: "{colors.slate}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-rotated:
    backgroundColor: "{colors.card-tint-lavender}"
    textColor: "{colors.brand-purple-800}"
    typography: "{typography.caption-bold}"
    rounded: "{rounded.full}"
    padding: "4px 10px"

  timeline:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    indicatorColor: "{colors.primary}"
    borderColor: "{colors.hairline}"

  bottom-action-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    padding: "{spacing.sm} {spacing.md}"
    border: "1px 0 0 {colors.hairline} solid"

  bottom-sheet:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xxl} {rounded.xxl} 0 0"
    padding: "{spacing.xl}"
    shadow: "{elevation.overlay}"

  critical-modal:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
    shadow: "{elevation.overlay}"
---

# KeyOps Mobile Design System

## 1. Propósito

KeyOps es una aplicación móvil interna para analistas que reciben solicitudes de
credenciales API y tramitan su generación, entrega, rotación, suspensión,
reactivación o revocación.

La aplicación no está destinada al responsable de integración del cliente. El
analista gestiona la solicitud y genera un enlace seguro para que el destinatario
descargue la credencial desde un site separado.

La interfaz debe transmitir:

- Seguridad.
- Claridad operativa.
- Trazabilidad.
- Rapidez de uso.

## 2. Usuarios

- **Analista**: consulta aplicaciones, genera credenciales y enlaces de entrega,
  regenera, suspende y reactiva.
- **Analista senior**: puede realizar las acciones anteriores y revocar.
- **Administrador**: puede realizar todas las operaciones autorizadas.
- **Auditor**: consulta la auditoría; no opera credenciales.
- **Responsable de integración del cliente**: no usa la app móvil; recibe el
  enlace y el OTP por separado.

Las acciones no autorizadas se omiten. No se muestran deshabilitadas.

## 3. Identidad

La marca se escribe siempre **KeyOps**, con `K` y `O` mayúsculas.

### Activo oficial

El logotipo oficial es [logo.png](./logo.png).

| Propiedad | Valor |
|---|---|
| Token | `{assets.logo-primary}` |
| Ruta relativa al documento | `./logo.png` |
| Ruta desde la raíz | `design/logo.png` |
| Formato | PNG RGBA |
| Dimensiones | 2816 × 1536 px |
| Composición | Símbolo y logotipo KeyOps |
| Fondo visible | Blanco texturizado |
| Texto alternativo | `KeyOps` |

La imagen combina un engranaje, una `K`, una llave y una flecha ascendente. El
nombre usa navy para `Key` y cyan para `Ops`.

### Uso en la app

- Usar la composición completa en la pantalla de acceso.
- Ancho recomendado en móvil: 200 px.
- Rango permitido: 144–240 px.
- Centrarla horizontalmente y conservar su relación de aspecto.
- Mantener al menos 16 px libres alrededor del contenido visible del logo.
- Usar siempre el texto alternativo `KeyOps`.
- En documentación y presentaciones puede utilizarse a mayor tamaño.

El PNG actual incluye mucho margen y un fondo blanco texturizado. Debe tratarse
como el original de referencia, no como un icono listo para la barra superior.
Hasta disponer de una variante compacta y transparente, la app bar debe mostrar
el nombre `KeyOps` como texto junto al espacio reservado para el futuro símbolo,
sin recortar manualmente este archivo.

### Usos no permitidos

- No deformar, estirar, rotar ni inclinar.
- No recolorear el símbolo ni el logotipo.
- No separar el símbolo del texto recortando este PNG.
- No eliminar el fondo con tolerancias automáticas que dañen los bordes.
- No colocarlo sobre fondos oscuros: el fondo blanco del archivo sería visible.
- No añadir contornos, sombras, brillos o efectos adicionales.
- No usarlo como icono de aplicación sin crear antes un activo específico.

La identidad combina navy, cyan y morado:

- Navy: confianza y seguridad.
- Morado: acción principal.
- Cyan y teal: identidad técnica.
- Pasteles: agrupación y estados secundarios.

No usar gradientes adicionales, glassmorphism ni sombras intensas.

## 4. Uso de tokens

Las expresiones entre llaves son referencias internas al sistema de diseño:

- `{typography.heading-2}` indica qué estilo aplicar.
- `{colors.primary}` indica qué color aplicar.
- `{components.badge-role}` indica qué componente utilizar.

Estas referencias **nunca se renderizan como texto visible**.

Ejemplo correcto:

```text
Texto visible: Iniciar sesión
Estilo aplicado: {typography.heading-2}
```

Ejemplo incorrecto:

```text
{typography.heading-2}
Iniciar sesión
```

El nombre de un componente tampoco se muestra. Un badge puede usar
`{components.badge-role}`, pero el usuario solo ve `Envío de mensajes`.

## 5. Tipografía

Toda la aplicación usa Inter con fallback a las fuentes del sistema.

| Token | Tamaño | Uso |
|---|---:|---|
| `{typography.heading-1}` | 32 px | Título principal de una pantalla |
| `{typography.heading-2}` | 26 px | Acceso y resultados importantes |
| `{typography.heading-3}` | 22 px | Títulos de sección |
| `{typography.heading-4}` | 18 px | Títulos de tarjeta |
| `{typography.subtitle}` | 16 px | Introducciones breves |
| `{typography.body-md}` | 16 px | Contenido y formularios |
| `{typography.body-sm}` | 14 px | Metadatos y ayuda |
| `{typography.caption}` | 13 px | Badges y etiquetas |
| `{typography.code}` | 14 px | Client ID, enlace y OTP |

No reducir el texto operativo por debajo de 14 px. El OTP puede aumentar hasta
32 px para facilitar su lectura.

## 6. Color y significado

El morado identifica la acción principal. No representa estados.

| Estado | Tratamiento |
|---|---|
| Activa | Verde y texto `Activa` |
| Suspendida | Ámbar y texto `Suspendida` |
| Sin credenciales | Gris y texto `Sin credenciales` |
| Inactiva por rotación | Lavanda y texto completo |
| Revocada | Rojo suave y texto `Revocada` |

El color nunca es el único indicador. Cada estado incluye una etiqueta textual y,
cuando ayude, un icono.

Pruebas y Producción deben distinguirse siempre:

- **Pruebas**: indicador morado.
- **Producción**: indicador rojo y confirmaciones reforzadas.

## 7. Estructura móvil

- Orientación vertical.
- Ancho de referencia: 390 px.
- Rango objetivo: 360–430 px.
- Márgenes laterales: 16 px.
- Una sola columna.
- Área táctil mínima: 48 × 48 px.
- Barra superior: 56 px.
- Selector de ambiente: 44 px.
- Acciones finales ancladas sobre la zona segura inferior.
- Desplazamiento vertical; no usar gestos laterales para operaciones.

En tablet, el contenido se limita a 600 px y permanece centrado.

## 8. Navegación

La barra superior incluye:

- Menú o botón Atrás de 48 × 48 px.
- Símbolo KeyOps.
- Título de pantalla cuando corresponda.

El selector `Pruebas | Producción` aparece en las pantallas operativas. No se
puede cambiar de ambiente durante una operación iniciada.

No es necesaria una barra inferior para el flujo mínimo. El retorno principal es
siempre a la lista o al detalle de la aplicación.

## 9. Componentes

### Botones

- Un único botón primario por pantalla.
- Etiquetas con verbos concretos: `Generar enlace`, `Regenerar`, `Suspender`.
- `Continuar` solo se usa cuando la siguiente acción sea inequívoca.
- Rojo únicamente para confirmar revocación u otra acción irreversible.
- Durante el procesamiento, el botón conserva su etiqueta, muestra progreso y
  bloquea pulsaciones repetidas.

### Tarjetas

Las tarjetas agrupan una unidad de información:

- Aplicación.
- Credencial.
- Enlace de entrega.
- OTP.
- Historial.

No anidar tarjetas. No usar más de un color pastel por tarjeta.

### Formularios

- Etiquetas persistentes encima del campo.
- Error inmediatamente debajo.
- El teclado no oculta el error ni la acción principal.
- El motivo es obligatorio para suspender, reactivar y revocar.

### Badges

Los badges son informativos. No son botones.

Textos permitidos:

- Roles: `Envío de mensajes`, `Consultas` u otro rol del catálogo.
- Estados: los cinco estados definidos en este documento.

Los nombres de tokens como `badge-role` o `badge-tag-purple` nunca son visibles.

## 10. Pantallas y comportamiento

### Acceso

- Logotipo KeyOps.
- Título `Iniciar sesión`.
- Texto `Acceso restringido a analistas autorizados`.
- Campos de usuario y contraseña.
- Acción primaria `Ingresar`.

No mostrar tokens tipográficos, enlaces de marketing ni contenido decorativo que
compita con el formulario.

### Lista de aplicaciones

- Selector de ambiente.
- Título `Credenciales`.
- Búsqueda y filtros.
- Tarjetas con institución, aplicación, rol y estado.
- Acción de cada tarjeta mediante botón explícito o menú accesible.

La acción global no debe generar una credencial sin haber seleccionado antes una
aplicación y validado su contexto.

### Detalle de aplicación

Es la pantalla principal del producto. Muestra, en este orden:

1. Institución.
2. Aplicación.
3. Ambiente.
4. Rol.
5. Estado de credencial.
6. Client ID, cuando exista.
7. Acciones permitidas.
8. Contacto, solicitud e IP declaradas.
9. Historial de estados.

El Client Secret no se muestra ni siquiera enmascarado.

### Operación sobre credencial

Antes de ejecutar una acción se muestra:

- Aplicación e institución.
- Ambiente.
- Estado actual.
- Consecuencia.
- Motivo, cuando sea obligatorio.
- Botón con el verbo de la operación.
- Cancelación disponible.

### Entrega al cliente

El analista no descarga la credencial en el móvil.

Después de generar o regenerar:

1. KeyOps genera un enlace al site de entrega.
2. La app permite compartir o copiar el enlace.
3. La app muestra un OTP de un solo uso válido durante dos minutos.
4. El OTP se copia y envía por separado.
5. El responsable de integración abre el enlace y descarga la credencial desde
   el site.

El enlace y el OTP aparecen en tarjetas separadas. Nunca incluir el OTP
automáticamente al compartir el enlace.

### Resultado

La pantalla de resultado muestra:

- Operación completada o fallida.
- Aplicación.
- Fecha y hora.
- Nuevo estado.
- Confirmación de auditoría.
- Enlace y OTP, solo cuando corresponda.
- Acción `Volver al detalle`.

Un fallo de regeneración debe indicar que la credencial anterior continúa activa.

## 11. Seguridad

- El ambiente permanece visible.
- El Client Secret no se muestra, copia ni precarga.
- El analista no descarga el archivo de credenciales.
- El OTP es de un solo uso y caduca a los dos minutos.
- El enlace y el OTP se comparten mediante acciones separadas.
- La contraseña del ZIP es distinta del OTP y no se muestra en la app.
- Regenerar inactiva inmediatamente la versión anterior.
- Suspender, reactivar y revocar exigen motivo.
- Revocar requiere permiso específico y confirmación irreversible.
- Toda operación genera trazabilidad.

## 12. Mensajes y contenido

La aplicación usa español claro y consistente.

Usar:

- `Estado`, no `Status`.
- `Iniciar sesión`, no `Login`.
- `Atrás`, no `Back`.
- `Credencial activa`, no `Generada` si el estado real es activa.
- `Generar enlace de entrega`, no `Descargar credenciales`.

Los mensajes deben explicar qué ha ocurrido y qué conserva el sistema. No culpar
al usuario ni revelar información sensible.

## 13. Accesibilidad

- Contraste mínimo WCAG AA.
- Objetivos táctiles mínimos de 48 × 48 px.
- Texto ampliable hasta 200 %.
- Orden de lectura coherente.
- Etiquetas accesibles para iconos.
- Foco visible con teclado externo.
- Color acompañado siempre de texto.
- Respeto a la preferencia de movimiento reducido.
- Errores persistentes; no comunicar fallos solo mediante toast.

## 14. Iconografía y decoración

- Iconos de línea simple, 24 px y trazo uniforme.
- Iconos críticos acompañados de texto.
- Las formas geométricas de color y las mallas se reservan para acceso, fondos
  vacíos o presentación de marca.
- No colocar decoración cerca de campos, OTP, estados o acciones críticas.

## 15. No hacer

- No mostrar referencias como `{typography.heading-2}`.
- No mostrar nombres de componentes como `badge-tag-purple`.
- No mostrar el Client Secret.
- No descargar credenciales en el móvil del analista.
- No ocultar el ambiente activo.
- No mezclar español e inglés.
- No mostrar acciones que el perfil no puede ejecutar.
- No usar gestos rápidos para revocar.
- No añadir precios, testimonios, planes, CTA comerciales o secciones de
  marketing.
- No convertir la interfaz en un dashboard de métricas ajeno al trabajo del
  analista.

## 16. Criterios de aceptación visual

Una pantalla puede considerarse final cuando:

- No contiene tokens o nombres de componentes visibles.
- Se reconoce inmediatamente si opera en Pruebas o Producción.
- Identifica la institución, aplicación, rol y estado.
- Presenta una única acción principal.
- Las acciones coinciden con el perfil y el estado.
- No expone el Client Secret.
- No ofrece descargar la credencial en el móvil.
- Se puede utilizar verticalmente con una mano.
- Mantiene la paleta navy, morada, cyan y pastel de KeyOps.
