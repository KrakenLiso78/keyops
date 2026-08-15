# Research: Identidad y usuarios corporativos

## Decisions

### OIDC Authorization Code con PKCE

**Decision**: usar Authorization Code, PKCE S256, state y nonce con el Worker como cliente confidencial.

**Rationale**: OIDC estandariza identidad y claims; RFC 9700 recomienda PKCE también para clientes confidenciales y exige proteger redirect, CSRF e inyección de código.

**Alternatives considered**: implicit flow expone más material al navegador; SDK propietario acopla el diseño antes de conocer el IdP; contraseñas locales contradicen el alcance.

### Sesión BFF

**Decision**: token OIDC solo en Worker y sesión KeyOps mediante cookie HttpOnly/Secure/SameSite.

**Rationale**: reduce exposición en el bundle/web storage y permite reautorizar cada operación con el estado persistente de KeyOps.

### Propagación de deshabilitación

**Decision**: máximo cinco minutos para cambios externos; inmediata para `enabled/profile` de Airtable.

**Rationale**: equilibra control con neutralidad de proveedor. El adaptador real deberá usar introspección, evento o sesión corta para cumplirlo.

### Identidad frente a autorización

**Decision**: el IdP posee identidad/vigencia; Airtable posee acceso, perfil y permisos KeyOps.

**Rationale**: KeyOps no administra el directorio y mantiene una matriz de mínimo privilegio propia y auditable.

## Primary sources

- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0-final.html)
- [RFC 9700: OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/info/rfc9700/)

