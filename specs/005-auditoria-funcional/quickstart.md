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
