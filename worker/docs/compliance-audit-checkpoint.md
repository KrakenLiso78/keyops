# Checkpoint de auditoría de cumplimiento

## Estado

El límite técnico local está implementado con un puerto neutral, un adaptador HTTPS y
un stub WORM verificable. Airtable continúa siendo únicamente la auditoría funcional
del caso de estudio. No constituye evidencia de inmutabilidad ni de conservación a
cinco años.

La activación de `/v2` exige conjuntamente un endpoint de cumplimiento, una credencial
de append y otra de consulta. No se ejecuta ninguna operación real v2 cuando ese límite
no está configurado. Los valores concretos se mantienen fuera del repositorio.

## Excepción constitucional temporal

| Campo                | Decisión                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| Principios afectados | VII, X y XI                                                                                                     |
| Alcance              | Eventos de acceso, catálogo, usuarios y credenciales reales del piloto                                          |
| Riesgo               | Dependencia de un almacén externo y posible pérdida o duplicado entre el efecto operativo y su acuse            |
| Mitigación           | ID idempotente, fingerprint canónico, acuse persistente, reconciliación, credenciales separadas y fallo cerrado |
| Responsable          | Seguridad                                                                                                       |
| Caducidad            | 2026-12-31                                                                                                      |

Antes de esa fecha se debe enmendar la constitución para reconocer el almacén WORM o
retirar la integración.

## Aprobaciones externas pendientes

No se ha proporcionado todavía evidencia de un proveedor corporativo real. Seguridad
y Compliance deben completar y aprobar lo siguiente antes del piloto:

- proveedor y propietario operativo;
- WORM o bloqueo equivalente frente a administradores operativos;
- política bloqueada de cinco años y cálculo de `retentionUntil`;
- separación de credenciales append/query/administración;
- límites de capacidad y coste aprobados;
- propietario del backup y ubicación de la evidencia;
- runbook y responsable de recuperación;
- procedimiento autorizado para pruebas update/delete;
- export de configuración o atestación sin secretos.

## Evidencia requerida para cerrar el checkpoint

1. Append de una muestra gobernada con acuse persistente.
2. Repetición idempotente y conflicto de payload rechazado.
3. Intentos update/delete con roles operativo y administrativo, conservando el
   original y registrando el intento.
4. Consulta de eventos históricos de versiones compatibles.
5. Export verificable de la política de retención.
6. Recovery drill con igualdad de conteo, orden, relaciones e integridad.
7. Trazabilidad E2E de los flujos implementados en las features 006–008.

Los tests locales demuestran el contrato y el comportamiento del adaptador, pero no
sustituyen ninguno de estos siete puntos contra el servicio corporativo.
