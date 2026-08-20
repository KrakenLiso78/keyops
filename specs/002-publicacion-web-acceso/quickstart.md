# Quickstart: Publicación web móvil y acceso por perfil

## Prerequisites

- Node.js 25.9.0 and npm 11.12.1.
- Airtable test base with the `Users` table from `data-model.md`.
- Cloudflare account on the Free plan.
- Worker secrets: `AIRTABLE_PAT`, `AIRTABLE_BASE_ID`, `DEMO_CREDENTIALS_JSON`, `SESSION_SIGNING_KEY`.

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

## Published verification

Export `mobile/dist`, deploy a Worker preview, and complete sign-in, navigation and environment change at 390 × 844 and 360 × 800. Confirm that `/v1/*` returns JSON and unknown client routes use the SPA fallback. Record the preview URL and date as evidence; do not claim native or corporate-identity validation.

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
