# Quickstart: Auditoría de cumplimiento y retención

## Local validation

```bash
cd worker
npm test -- compliance-audit
npm run test:contract -- compliance-audit
cd ../mobile
npm test -- audit
```

Test success/failure/rejection, duplicate append, conflicting payload, response loss, version upcasting, deterministic order and secret redaction against the stub.

## Provider checkpoint

Compliance must approve the provider, WORM/retention-lock settings, five-year calculation, append/query credentials, administrative boundaries, backup ownership and recovery runbook. Preserve configuration evidence without secrets.

## Pilot validation

Append a governed sample, attempt update/delete with operational and administrative test roles, verify original integrity, query old-version fixtures and execute one recovery drill. The feature remains unvalidated if evidence comes only from Airtable or mocked time.

