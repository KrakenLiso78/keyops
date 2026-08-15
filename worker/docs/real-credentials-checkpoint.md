# Checkpoint de credenciales reales y entrega segura

## Límite implementado

KeyOps expone el contrato `/v2` únicamente desde el Worker. La app no selecciona
proveedores ni puede activar el modo real mediante parámetros. Los dos adaptadores
neutrales requieren configuración conjunta del servidor y rechazan respuestas que
incluyan Client Secret, contraseña, OTP, ZIP o URL de descarga.

Los ambientes permitidos se declaran en `REAL_CREDENTIAL_ENVIRONMENTS`. Una operación
fuera de esa lista se rechaza antes de invocar al proveedor. Airtable conserva solo
referencias opacas, fingerprints, receipts y estados confirmados o reconciliables.

## Contratos y aprobaciones externas pendientes

Antes de implementar los adaptadores corporativos concretos deben registrarse:

| Evidencia                                                                  | Estado    |
| -------------------------------------------------------------------------- | --------- |
| Owner del servicio de credenciales                                         | Pendiente |
| Owner del servicio de entrega                                              | Pendiente |
| Sandbox autorizado y datos de prueba                                       | Pendiente |
| Scopes mínimos de emisión, rotación, transición, estado y acceptance probe | Pendiente |
| Semántica atómica de rotación y operación idempotente                      | Pendiente |
| Canales corporativos separados para contraseña y OTP                       | Pendiente |
| Retención y correlación de auditoría                                       | Pendiente |

No se considera implementada la integración real ni se habilita un piloto hasta que
estas evidencias se aprueben y se completen T047–T052.

## Excepción constitucional temporal

| Campo                | Decisión                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Principios afectados | VII y XI: el servicio corporativo gobierna secreto, versión y aceptación real                                                                   |
| Alcance              | Emisión, rotación, estado efectivo, revocación, ZIP, contraseña y OTP                                                                           |
| Riesgo               | Divergencia temporal entre proveedor, metadata Airtable y auditoría tras una respuesta incierta                                                 |
| Mitigación           | Idempotency-Key, operation ID externo, status/acceptance probe, receipts `pending`/`confirmed`/`reconciliation_required` y cero éxito optimista |
| Responsable          | Seguridad                                                                                                                                       |
| Caducidad            | 2026-12-31; antes debe enmendarse la constitución o retirarse esta integración                                                                  |
