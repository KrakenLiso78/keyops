# Quickstart: Auditoría funcional persistente

## Prerequisites

Shared Worker from features 002–004 or independent fixtures, the `AuditEvents` table, and an Airtable test base with remaining record budget.

## Local checks

```bash
cd worker && npm test -- audit
cd ../mobile && npm test -- audit
cd ../worker && npm run test:contract -- audit
```

Verify factory allowlists, secret redaction, authorized filters, deterministic ties and rejection of every unsupported event mutation route.

## Persistent check on demand

Run `npm run test:integration:airtable -- audit`. Generate one successful attempt, one controlled provider failure and one permission rejection. Start a new client/process, query as auditor, and verify all three events and required fields. Search serialized fixtures/events for forbidden key names and synthetic OTP values.

## Manual journey

Perform sign-in plus one management or credential operation in the published preview. Open audit as an authorized profile, filter the events, then try direct access as analyst. Confirm the rejection is also visible to an authorized user. Record explicitly that this proves functional persistence only.

## Local evidence — 2026-08-15

- Worker: 7 legacy checks, 72 passing unit/integration tests with 2 remote tests
  skipped, and 25 contract tests.
- Mobile: 93 suites and 162 tests, plus local contract check and successful web
  export.
- The local evidence covers redaction, success/failure/rejection, authorization,
  deterministic filtering and read-only API behavior.
- The real Airtable run and published-preview journey remain pending because no
  remote credentials or active preview were available in this environment.

This evidence proves functional behavior in the local harness. It does **not**
prove immutability against Airtable administrators, certified retention for five
years, or production compliance.

## Published preview evidence — 2026-08-20

- At 360 × 800, an administrator signed in through the feature 002 Quick Tunnel, issued a
  synthetic credential and opened Auditoría without reloading the single-page application.
- The audit list exposed one completed `sign_in.v1` event and one completed `issue.v1` event with
  actor, demonstration environment, request identifier and application context.
- The document width remained 360 px, so the filtered audit view introduced no horizontal
  overflow.

The fake adapter keeps these events only in the current JavaScript process. This journey proves
authorized access and functional event presentation, not Airtable persistence, rejected-operation
coverage across processes, administrative immutability or regulatory retention.

## Persistent Airtable evidence — 2026-08-20

- `airtable-audit-write.test.ts` persisted one successful, one failed and one rejected event in
  base `appnNMuwzI72qsjyE`, then reloaded all three from a fresh repository.
- Every event carried its required correlation fields and unique `testRunId`; cleanup removed the
  three test-owned records and a subsequent read found no residual audit event.
- This proves functional persistence only. It does not prove administrator-resistant immutability
  or certified five-year retention.
