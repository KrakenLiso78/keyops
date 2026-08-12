# Validación de layout web

**Fecha**: 2026-08-12
**Entorno**: servidor Expo Web local con viewport móvil.

Una captura real de Safari en iPhone reveló que los cuadrados decorativos del
detalle invadían el título. La cabecera se corrigió reservando una franja de
44 px, independiente del texto y con desbordamiento oculto.

La comprobación posterior en navegador cubrió 360, 390 y 430 px. En los tres
anchos, la franja decorativa terminó en `y=159` y el título comenzó en `y=167`,
sin intersección. A 360 px el título ocupa dos líneas; a 390 y 430 px permanece
en una. También se verificó que el inventario de Pruebas renderiza las 12
aplicaciones del seed ampliado.
