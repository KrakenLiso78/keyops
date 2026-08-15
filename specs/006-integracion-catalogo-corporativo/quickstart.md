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

