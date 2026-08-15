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

## Persistent verification on demand

Run the Worker integration script against the dedicated Airtable test base. Disable a seeded user in Airtable, start a new process and verify that `GET /v1/session` rejects the existing token. Re-enable the fixture after the test.

## Published verification

Export `mobile/dist`, deploy a Worker preview, and complete sign-in, navigation and environment change at 390 × 844 and 360 × 800. Confirm that `/v1/*` returns JSON and unknown client routes use the SPA fallback. Record the preview URL and date as evidence; do not claim native or corporate-identity validation.
