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
