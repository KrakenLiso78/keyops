# Corporate identity checkpoint

## Required before the concrete provider adapter

- [ ] Named identity owner and security escalation contact.
- [ ] HTTPS discovery URL and exact issuer.
- [ ] Confidential client registration and approved redirect URIs.
- [ ] Audience, signing algorithms, JWKS rotation and clock-skew policy.
- [ ] Stable subject and minimized display-name claims.
- [ ] Test identities: authorized, unknown and externally disabled.
- [ ] Active-state revalidation or equivalent disable propagation within five
      minutes.
- [ ] Confirmation that KeyOps never manages the corporate directory.

OIDC client secrets and tokens remain Worker-only. ID/access/refresh tokens,
authorization codes, PKCE verifiers, cookies and full claims must not be stored
in Airtable, audit events, logs or the mobile bundle.

## Constitutional exception

- Principles: VII and XI.
- Owner: Security.
- Risk: a short active interval after external disable or attribute divergence.
- Mitigation: Airtable authorization on every operation and corporate validity
  no older than five minutes; fail closed when it cannot be confirmed.
- Expires: 2026-12-31. Before that date the constitution must be amended or the
  integration removed.
