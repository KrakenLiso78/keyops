# Quickstart: Identidad y usuarios corporativos

## Local OIDC validation

```bash
cd worker
npm test -- identity
npm run test:contract -- identity
cd ../mobile
npm test -- users
```

Use the OIDC stub to test valid callback, unknown/disabled user, wrong issuer/audience/nonce, reused state, redirect mismatch and provider outage. Confirm no token appears in browser storage, responses or logs.

## Authorization persistence

Against Airtable test, register the same issuer/subject twice, change profile, disable the user and start a new Worker process. Confirm one record and immediate authorization changes.

## Corporate checkpoint

Record discovery URL, client ID/secret location, exact redirect URIs, claims allowlist, logout/revocation behavior and the mechanism that guarantees disable propagation within five minutes. Run the three identity scenarios from the spec and retain audit evidence.

## Local evidence — 2026-08-15

- `cd worker && npm run validate`: TypeScript passed; 44 Vitest files and 117
  tests passed, with four provider-backed integration files skipped; 15
  contract files and 35 contract tests passed.
- The local OIDC contract covers S256 PKCE, encrypted state/nonce, one-use
  callback, exact issuer/audience/redirect, RS256 signature, authorized,
  unknown and disabled identities, five-minute cookie expiry, logout and audit
  redaction.
- `cd mobile && npm run lint && npm run format:check && npm run typecheck && npm
test -- --runInBand`: 97 suites and 170 tests passed.
- `npm run doctor`, `npm run test:contract:local` and `npm run export:web`:
  Expo Doctor passed 21/21 checks, the local contract passed and 20 static web
  routes were exported.

This proves the provider-neutral flow and administration behavior with local
stubs. No real discovery document, corporate tenant, external disable
propagation or provider-backed audit evidence was validated by that local run.
Tasks T041–T044 therefore remain open.

## Airtable authorization evidence — 2026-08-20

- The migration added `corporateIssuer`, `corporateSubject` and `identityValidatedAt` to `Users`.
- `airtable-authorized-users.test.ts` registered the same issuer/subject twice, observed one record,
  changed its profile, disabled it and reloaded the result through a third client.
- The integration user was deleted in `finally`. This validates KeyOps authorization persistence,
  not real OIDC discovery, login, provider disable propagation or the five-minute pilot target.
