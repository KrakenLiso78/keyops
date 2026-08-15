# Quickstart: Credenciales reales y entrega segura

## Local validation

```bash
cd worker
npm test -- real-credentials
npm run test:contract -- real-credentials
cd ../mobile
npm test -- credentials
```

Use provider stubs to fail before/after each external step. Verify one effect per idempotency key, reconciliation after response loss, no optimistic success and zero secret patterns in output/log fixtures.

## Metadata persistence

Against Airtable test, persist only external references/receipts, restart the Worker and reconcile against the stub. Inspect serialized records for Client Secret, ZIP, password, OTP and delivery URL.

## Corporate checkpoint and E2E

Record service owners, contracts, auth scopes, sandbox, atomic rotation/status semantics, delivery channels and audit integration. In the authorized environment execute issue, rotate, suspend, reactivate, revoke and OTP scenarios. The feature is not pilot-ready until acceptance probes confirm real effects.

