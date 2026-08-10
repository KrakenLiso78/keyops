# Validación de layout web

**Fecha**: 2026-08-10  
**Entorno**: exportación Expo Web local.

La comprobación automatizada de esta máquina cubre el bundle web, etiquetas
accesibles y controles con altura mínima de 48 px. No hay un navegador
automatizado ni un dispositivo remoto disponible para certificar capturas
visuales a 360, 390 y 430 px.

Los anchos de 360, 390 y 430 px se cubren por el layout fluido de React Native
Web (contenedores flexibles, campos y botones de anchura disponible) y por las
regresiones de accesibilidad. La inspección visual humana sigue fuera del
alcance de esta máquina.
