# Quickstart: Ciclo de vida de credenciales sintéticas

## Prerequisites

Features 002–003 or equivalent fixture users/applications, the four Airtable tables from `data-model.md`, and Worker secrets `DELIVERY_PEPPER` plus the shared Airtable/session secrets.

## Local checks

```bash
cd worker && npm test -- credentials
cd ../mobile && npm test -- credentials
cd ../worker && npm run test:contract -- credentials
```

Run transition, authorization, idempotency, expiry and redaction cases before wiring UI actions. Tests must observe the intended failure before implementation.

## Persistent checks on demand

Run `npm run test:integration:airtable -- credentials` against dedicated fixtures. The suite issues, retries with the same key from a new client, rotates, verifies exactly one active version, suspends/reactivates/revokes, and verifies a code can be consumed only once. It then removes only records carrying its unique test run ID.

## Manual mobile journey

From the published web preview, use synthetic test fixtures to complete issue → delivery, regenerate, suspend → reactivate, and revoke. Interrupt one response and retry with the retained idempotency key. Confirm every screen says synthetic/non-functional and no action displays optimistic success.
