# Quickstart: Datos representativos persistentes

## Seed

Create the three tables from `data-model.md`, configure the dedicated test base and run the idempotent seed command. It must create at least 20 applications split across both environments and credential display states, in batches of at most ten.

## Local checks

```bash
cd worker && npm test
cd ../mobile && npm run validate
cd ../worker && npm run test:contract
```

Verify list, search, empty result, detail, unauthorized scope and conflict responses against the local Worker.

## Persistent check on demand

Run `npm run test:integration:airtable -- applications`. The scenario updates a management context, creates a new HTTP client/session, reads the same application as another authorized fixture user, and then restores the original value. Capture the request count and do not run this command in the continuous unit-test loop.

## Evidence

Record seed counts, Airtable test base identifier (never the PAT), test timestamp and contract version. A passing fake test is supporting evidence only, not persistence evidence.
