# Quickstart: Auditoría de cumplimiento y retención

## Local validation

```bash
cd worker
npm test -- compliance-audit
npm run test:contract -- compliance-audit
cd ../mobile
npm test -- audit
```

Test success/failure/rejection, duplicate append, conflicting payload, response loss, version upcasting, deterministic order and secret redaction against the stub.

### Evidencia ejecutada — 2026-08-20

Worker:

- `npm run validate`: TypeScript correcto; 7 tests legacy superados; Vitest 64
  ficheros superados y 5 omitidos por requerir servicios externos, 160 tests
  superados y 5 omitidos; contratos 19/19 ficheros y 43/43 tests.
- Las 25 pruebas específicas de cumplimiento cubren evento/allowlist, cinco años,
  idempotencia, conflicto, pérdida de acuse, upcasting, filtros/cursor, ausencia de
  mutaciones, manipulación, redacción, composición dual y recovery local.

Móvil:

- Expo Doctor: 21/21 comprobaciones superadas después de alinear los parches de SDK
  57 mediante `npx expo install --fix`.
- ESLint, TypeScript y Prettier de `src`, `tests` y configuración: correctos.
- Jest: 101/101 suites y 178/178 tests; contrato local 1/1.
- `expo export --platform web`: 20 rutas estáticas exportadas.

El script móvil integral detecta además `mobile/vercel.json`, un archivo local no
versionado y ajeno a esta feature que no está formateado. No se modificó ni se incluyó
en los commits; se ejecutaron y superaron individualmente todos los gates del proyecto
excluyendo ese archivo ajeno.

## Provider checkpoint

Compliance must approve the provider, WORM/retention-lock settings, five-year calculation, append/query credentials, administrative boundaries, backup ownership and recovery runbook. Preserve configuration evidence without secrets.

Estado: pendiente. No se dispone de proveedor, credenciales, owner, export de política
ni runbook aprobados. El detalle y la excepción con caducidad están en
`worker/docs/compliance-audit-checkpoint.md`.

## Pilot validation

Append a governed sample, attempt update/delete with operational and administrative test roles, verify original integrity, query old-version fixtures and execute one recovery drill. The feature remains unvalidated if evidence comes only from Airtable or mocked time.

No ejecutado: el stub demuestra el contrato y el fallo cerrado, pero no acredita WORM
frente a administradores, retention lock durante cinco años, backup corporativo ni un
recovery real. Por ello T037–T042 permanecen abiertas y la feature no debe presentarse
como validada para piloto.
