# Corporate catalog checkpoint

## Required before the provider adapter

- [ ] Named corporate owner and escalation contact.
- [ ] Approved read-only contract and base URL for a non-production environment.
- [ ] Authentication method and least-privilege read scope.
- [ ] Stable application, institution and role identifiers.
- [ ] Environment and user-scope semantics.
- [ ] Pagination, rate limits, timeout and availability expectations.
- [ ] Representative sample and provider-unavailable test window.
- [ ] Confirmation that KeyOps must never call provider write methods.

Provider secrets are configured only as Worker secrets. They must not appear in
fixtures, logs, audit events, mobile bundles or committed environment files.

## Constitutional exception

- Principles: VII and XI.
- Owner: Security.
- Risk: divergence between corporate identity/classification and Airtable
  operational references.
- Mitigation: stable IDs, request-time join, 60-second maximum cache, orphan
  detection and no demo fallback.
- Expires: 2026-12-31. Before that date the constitution must be amended or this
  integration removed.
