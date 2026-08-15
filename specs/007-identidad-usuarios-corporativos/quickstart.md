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

