# KeyOps — Mapa de features

Este documento separa el alcance general de KeyOps en features verticales, demostrables y planificables de forma independiente. La feature `001-gestion-credenciales-api` queda como especificación paraguas e histórico de la definición original; no debe generar un nuevo `plan.md` ni nuevas `tasks.md`.

## Criterio de división aplicado

- **Flujo de trabajo y valor observable**: publicación y acceso, consulta de datos, ciclo de credenciales y auditoría producen resultados distintos que pueden demostrarse por separado.
- **Complejidad de criterios de aceptación**: las transiciones de credenciales permanecen juntas porque forman una máquina de estados coherente, mientras que registrar y consultar auditoría constituyen otro resultado para otros perfiles.
- **Variaciones de datos**: los datos representativos persistentes forman la feature 003; sustituirlos por datos corporativos reales forma la feature 006.
- **Dependencias externas**: catálogo, identidad, servicio real de credenciales, garantías de cumplimiento y consumo se separan para que cada integración pueda planificarse cuando exista acceso al sistema correspondiente.

Los cortes son verticales: cada feature incluye comportamiento visible, reglas, persistencia o fuente de verdad y criterios de aceptación. No existen features separadas de interfaz, lógica o datos.

## Estado de las features

Una feature solo puede figurar como **completada** cuando todos sus escenarios se han validado con la evidencia exigida por su propio `spec.md`. La inclusión en el Sprint no significa que ya esté construida.

### Sprint MVP web actual

| Feature | Resultado demostrable | Historias originales | Estado actual |
| ------- | --------------------- | -------------------- | ------------- |
| [002 — Publicación web y acceso](002-publicacion-web-acceso/spec.md) | Un analista entra en la aplicación web móvil, ve solo sus acciones y opera en un ambiente de demostración inequívoco. | US-01, US-13 | Definida; pendiente de implementación y validación. |
| [003 — Datos representativos persistentes](003-datos-representativos-persistentes/spec.md) | El analista localiza una aplicación, consulta su detalle y conserva el contexto de gestión entre sesiones. | US-02, US-03, US-10 | Definida; pendiente de implementación y validación. |
| [004 — Ciclo de credenciales sintéticas](004-ciclo-credenciales-sinteticas/spec.md) | El analista completa emisión, rotación, suspensión, reactivación, revocación y reentrega sin secretos reales. | US-04, US-05, US-06, US-07, US-09 | Definida; pendiente de implementación y validación. |
| [005 — Auditoría funcional](005-auditoria-funcional/spec.md) | Las operaciones exitosas, fallidas y rechazadas dejan un historial persistente consultable por los perfiles permitidos. | US-08, US-12 | Definida; pendiente de implementación y validación. |

Estas cuatro features cubren las 12 historias comprometidas para el MVP web. Cuando las cuatro estén validadas podrá afirmarse: “En este Sprint se han completado las features 002, 003, 004 y 005”. Hasta entonces debe informarse su estado real.

### Futuros sprints — requisitos previos al piloto real

| Feature | Resultado futuro | Origen | Motivo para diferirla |
| ------- | ---------------- | ------ | --------------------- |
| [006 — Integración con catálogo corporativo](006-integracion-catalogo-corporativo/spec.md) | Instituciones, aplicaciones y roles proceden del sistema corporativo. | Dependencia transversal identificada en US-02 y US-03. | Depende de contratos, permisos y disponibilidad externos. |
| [007 — Identidad y usuarios corporativos](007-identidad-usuarios-corporativos/spec.md) | Acceso corporativo y administración real de usuarios, perfiles y deshabilitación. | US-01 y US-14. | Añade integración de identidad y un módulo administrativo. |
| [008 — Credenciales reales y entrega](008-credenciales-reales-entrega/spec.md) | Las operaciones afectan al servicio real de credenciales y la entrega protege secretos reales. | Evolución productiva de US-04, US-05, US-06, US-07 y US-09. | Requiere garantías de seguridad y servicios de confianza fuera del MVP. |
| [009 — Auditoría de cumplimiento](009-auditoria-cumplimiento/spec.md) | Los eventos son resistentes a administradores y se conservan cinco años. | Evolución de cumplimiento de US-08 y US-12. | La persistencia funcional del MVP no demuestra estas garantías. |

Las features 006 a 009 son condiciones previas para afirmar que KeyOps está preparado para un piloto con datos y credenciales reales.

### Futuro posterior al MVP

| Feature | Resultado futuro | Origen | Relación con el piloto inicial |
| ------- | ---------------- | ------ | ------------------------------ |
| [010 — Consulta de consumo](010-consumo-aplicaciones/spec.md) | El analista consulta mensajes, servicios, IP y último consumo de cada aplicación. | US-11. | Aporta soporte contextual, pero no bloquea el ciclo de vida básico. |

La administración de usuarios original US-14 se incorpora en la feature 007. Las aplicaciones nativas, el funcionamiento sin conexión, las notificaciones, las fechas de caducidad, las alertas y las renovaciones preventivas permanecen aparcadas y todavía no constituyen features planificables.

## Secuencia de planificación

Cada directorio de feature tendrá su propio `plan.md` y sus propias `tasks.md`. La secuencia recomendada para el Sprint actual es 002 → 003 → 004 → 005. Los artefactos técnicos existentes dentro de `001-gestion-credenciales-api` son anteriores a esta división y se conservan solo como referencia histórica hasta que cada nueva feature disponga de sus propios artefactos.
