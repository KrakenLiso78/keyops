# Quickstart: Credenciales reales y entrega segura

## Local validation

```bash
cd worker
npm test -- real-credentials
npm run test:contract -- real-credentials
cd ../mobile
npm test -- credentials
```

Use provider stubs to fail before/after each external step. Verify one effect per idempotency key, reconciliation after response loss, no optimistic success and zero secret patterns in output/log fixtures.

### Evidencia local — 2026-08-15

- Worker `npm run validate`: typecheck correcto; 7 tests legacy; 54 ficheros Vitest aprobados y 5 omitidos por integración externa; 138 tests aprobados y 5 omitidos; contrato 18/18 ficheros y 40/40 tests.
- Móvil `npm run validate`: Expo Doctor 21/21, lint, formato y typecheck correctos; 100 suites y 174 tests aprobados; contrato local 1/1 y exportación web de 20 rutas.
- Los tests de `/v2` cubren emisión, rotación, transiciones, terminalidad, permisos, respuesta perdida, reintento idempotente y fallos después de proveedor, metadata, auditoría y entrega.
- `real-credential-redaction.test.ts` rechaza respuestas externas con campos de secreto y comprueba que receipts y referencias serializados no contienen Client Secret, contraseña, OTP ni URL de descarga.
- En la ejecución local del 2026-08-15, `airtable-real-references.test.ts` quedó omitido porque no
  se proporcionó acceso Airtable; la evidencia persistente posterior se registra a continuación.

### Evidencia Airtable — 2026-08-20

- La migración creó `RealCredentialReferences` y `RealOperationReceipts` con los 31 campos no
  secretos documentados entre ambas tablas.
- `airtable-real-references.test.ts` creó una referencia desechable, cambió su correlación de
  operación, la releyó desde otro cliente y comprobó que la serialización no contiene Client
  Secret, ZIP, contraseña, OTP ni URL de entrega.
- La referencia se eliminó al terminar. T047–T052 siguen abiertas: no se ha contactado un servicio
  corporativo de credenciales ni de entrega.

## Metadata persistence

Against Airtable test, persist only external references/receipts, restart the Worker and reconcile against the stub. Inspect serialized records for Client Secret, ZIP, password, OTP and delivery URL.

## Corporate checkpoint and E2E

Record service owners, contracts, auth scopes, sandbox, atomic rotation/status semantics, delivery channels and audit integration. In the authorized environment execute issue, rotate, suspend, reactivate, revoke and OTP scenarios. The feature is not pilot-ready until acceptance probes confirm real effects.
