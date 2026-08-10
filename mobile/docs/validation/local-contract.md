# Contrato local

Fecha: 2026-08-10

Comando: `npm run test:contract:local`

Resultado: correcto. El stub HTTP local devuelve `contractVersion`, `requestId`,
`auditEventId` y resultado de operación simulados. No constituye evidencia de
idempotencia o auditoría de un servicio real.
