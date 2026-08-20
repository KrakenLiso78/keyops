# Quickstart: Integración con catálogo corporativo

## Local contract validation

```bash
cd worker
npm test -- catalog
npm run test:contract -- catalog
```

Start the provider stub with fixtures for valid pages, duplicates, incomplete records, authorization scope and outage. Verify `/v1/applications` preserves the mobile contract and never falls back to demo data.

## Airtable join validation

Use the dedicated Airtable test base with `ApplicationOperationalContexts`. Update only a management field, start a new Worker process and confirm that catalog identity remains external while the context persists.

## Corporate checkpoint

Before enabling the real adapter, record the provider owner, base URL, authentication method, scopes, rate limits, stable-ID rules and test environment. Run the sample reconciliation from the spec and retain evidence. Without this checkpoint, the feature remains adapter-ready but not pilot-validated.

## Local evidence — 2026-08-15

- Worker: 34 passing local test files with 3 remote integrations skipped, 88
  passing tests and 13 contract files with 31 passing tests.
- Mobile: Expo Doctor, lint, format, typecheck, 94 test suites, local contract
  check and web export pass.
- The neutral stub proves strict DTO validation, environment and institution
  scope, a maximum 60-second cache, visible outages, no representative-data
  fallback, safe audit outcomes and GET-only provider access.
- `airtable-operational-context.test.ts` is available for the cross-process
  persistence check but was not executed because no authorized Airtable
  credentials were available.

This is local adapter evidence only. The real provider owner, contract, limits,
stable-ID rules and authorized environment are still unknown, so no pilot
reconciliation or claim of zero out-of-scope corporate records has been made.

## Airtable context evidence — 2026-08-20

- The additive migration created `ApplicationOperationalContexts` with all nine documented fields.
- `airtable-operational-context.test.ts` created a disposable context, changed its management ticket,
  reloaded it from a fresh client and deleted the fixture after verification.
- Corporate identity and classification remained outside Airtable. The real catalog checkpoint
  T029–T032 remains open because this test does not contact a corporate catalog.
