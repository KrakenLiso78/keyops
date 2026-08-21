# Quickstart: Publicación web móvil y acceso por perfil

## Prerequisites

- Node.js 25.9.0 and npm 11.12.1.
- Airtable test base with the `Users` table from `data-model.md`.
- Cloudflare account on the Free plan.
- Worker secrets: `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, `DEMO_CREDENTIALS_JSON`, `SESSION_SIGNING_KEY`.

## Runtime mode

`KEYOPS_MODE` is a Worker configuration variable, never a browser setting:

- `fake` is the deployed default. It reads the persistent representative catalog from Airtable,
  as well as authorized users, operational context, synthetic credentials and audit.
- `real` disables that catalog and uses only configured external catalog, identity, credential,
  delivery and compliance providers. Missing provider configuration is reported as unavailable;
  it never falls back to representative data.

Deploy a mode explicitly from `worker/`:

```bash
npx wrangler deploy --var KEYOPS_MODE:fake
# or, once every external provider is configured:
npx wrangler deploy --var KEYOPS_MODE:real
```

`GET /v1/health` returns the active `mode` without exposing configuration values or secrets.

### Restaurar la demostración persistente

Al abrir el menú con un usuario administrador, el modo `fake` muestra
**Restablecer demostración**. Tras confirmar, el Worker borra los datos actuales
de KeyOps en Airtable y carga el seed canónico. La acción no existe en modo
`real`, requiere autenticación de administrador y queda registrada en auditoría.

También se conserva la alternativa de terminal para administración local:

```bash
cd worker
npm run airtable:reset -- --confirm-reset=KeyOps
```

Ambas opciones son destructivas. La recarga restaura los usuarios semilla, por
lo que una cuenta creada después del seed deja de existir y deberá iniciarse una
nueva sesión con una cuenta semilla configurada en `DEMO_CREDENTIALS_JSON`.

## Local verification

```bash
cd worker && npm ci && npm test
cd ../mobile && npm ci && npm run validate
cd ../worker && npm run dev
```

In another terminal, run Expo Web configured with `EXPO_PUBLIC_DATA_SOURCE=remote` and the local `/v1` origin. Verify sign-in, disabled-user rejection, direct unauthorized navigation, environment reset and sign-out.

### Local evidence — 2026-08-15

- `mobile/npm run validate`: Expo Doctor 21/21, lint, format, TypeScript, 81 Jest suites with 138 tests, local contract and web export passed.
- `mobile/npm run test:e2e`: 4/4 browser journeys passed at 390 × 844 and 360 × 800, including login, environment change, horizontal-overflow check and direct-route authorization.
- `worker/npm run validate`: TypeScript, 5 legacy model tests, 5 Vitest unit/security tests and 2 session contract tests passed.
- This evidence uses the explicit fake adapter for the browser E2E. It does not replace the Airtable integration check or a published Worker preview.

## Persistent verification on demand

Run the Worker integration script against the dedicated Airtable test base. Disable a seeded user in Airtable, start a new process and verify that `GET /v1/session` rejects the existing token. Re-enable the fixture after the test.

### Persistent evidence — 2026-08-20

- `RUN_AIRTABLE_INTEGRATION=1 npx vitest run tests/integration/airtable-session.test.ts` passed against base `appnNMuwzI72qsjyE`.
- The test disabled the seeded user through one Airtable client, observed the disabled state from a fresh client and restored the original record in cleanup.
- Airtable omits unchecked checkbox fields. The persisted-user mapper now treats an absent `enabled` field as `false`, with a unit regression covering that representation.

## Published verification

Export `mobile/dist`, deploy a Worker preview, and complete sign-in, navigation and environment change at 390 × 844 and 360 × 800. Confirm that `/v1/*` returns JSON and unknown client routes use the SPA fallback. Record the preview URL and date as evidence; do not claim native or corporate-identity validation.

### Historical Quick Tunnel evidence — 2026-08-20

- Quick Tunnel: `https://tropical-thrown-colours-tribunal.trycloudflare.com/sign-in`.
- The exported fake build loaded through the public URL, accepted the demonstration administrator
  and reached `/applications` at 390 × 844 and 360 × 800.
- Both viewports reported a document width equal to the viewport width, with no horizontal
  overflow on the application list.
- This URL exists only while the local static server and `cloudflared` process remain running. A
  Quick Tunnel has no stable hostname or uptime guarantee and is evidence for development access,
  not a deployment or an availability result.
- The preview uses `EXPO_PUBLIC_DATA_SOURCE=fake`; it does not validate Airtable persistence,
  deployed Worker routing, native iOS behavior or corporate identity.

### Canonical Vercel publication — partial evidence 2026-08-20

- Fixed frontend URL: `https://keyops-three.vercel.app/sign-in`.
- `https://keyops-three.vercel.app/v1/health` returns the deployed Worker JSON through the
  Vercel rewrite, and `POST /v1/sessions` returns 200 for the configured demonstration user.
- The published sign-in page has no horizontal overflow at 390 × 844 or 360 × 800.
- Authenticated navigation completed at both 390 × 844 and 360 × 800. Each viewport reached
  `/applications` without horizontal overflow after the demonstration sign-in.
- The application list reports `catalog_not_configured` rather than substituting demonstration
  records. This is the expected limitation until feature 006 has an authorized corporate catalog.

## Free-tier and secret review — 2026-08-20

The current official limits were rechecked before publication:

- [Cloudflare Workers Free](https://developers.cloudflare.com/workers/platform/limits/):
  100,000 requests/day, 10 ms CPU/request, 50 subrequests/request, 3 MB compressed Worker,
  20,000 static files and 25 MiB per static file.
- [Airtable Free](https://support.airtable.com/v1/docs/managing-api-call-limits-in-airtable):
  1,000 Web API calls/workspace/month and 5 requests/second.
- [TryCloudflare Quick Tunnels](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/):
  development/testing only, no SLA, no SSE and at most 200 concurrent in-flight requests.

`expo export --platform web` produced 79 static files and a 2.7 MB uncompressed JavaScript
bundle. `wrangler deploy --dry-run` reported 747.97 KiB uploaded and 118.87 KiB gzip, below the
3 MB Worker limit. Four scans over `mobile/dist` and three over the bundled Worker found zero
files containing configured secret names, bearer-looking values, private-key markers or common
secret prefixes. The two mobile persistence/Client Secret tests and twelve Worker redaction tests
passed. Wrangler emitted only a local sandbox warning because it could not write its diagnostic
log under `~/Library/Preferences`; the dry-run bundle was still generated and inspected.

This review validates package size and static secret leakage. It does not measure deployed CPU
time, monthly Airtable consumption or remote uptime; those remain operational observations.
