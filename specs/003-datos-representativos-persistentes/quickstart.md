# Quickstart: Datos representativos persistentes

## Seed

The base schema is shared by features 002–005. The reproducible reset extracts the canonical
fixtures from `mobile/src/data/fake/seed.ts`, clears all nine KeyOps tables and reloads 4 users,
24 institutions, 4 API roles and 24 applications. Lifecycle and audit tables return to empty
because the original seed did not contain records for them.

```bash
cd worker
cp .env.example .env
npm run airtable:seed:check
npm run airtable:reset -- --confirm-reset=KeyOps
```

Store the base-scoped PAT only in `worker/.env`. The reset uses batches of at most ten, validates
all tables before the first deletion and verifies the final record counts. Full setup and failure
recovery are documented in `worker/scripts/airtable/README.md`.

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

- 2026-08-15: reset inicial ejecutado sobre `appnNMuwzI72qsjyE` mediante la integración
  autenticada de Airtable y releído desde una nueva operación.
- Recuentos verificados: 4 `Users`, 24 `Institutions`, 4 `ApiRoles`, 24 `Applications`; cinco
  tablas de ciclo de vida y auditoría vacías; total 56.
- Distribución verificada: 12 aplicaciones `test`, 12 `production` y presencia de los cinco
  estados de visualización.
- El runner REST local queda validado en sintaxis, tests y modo seguro; su ejecución directa
  requiere un PAT local en `worker/.env` y no se ha utilizado para esta evidencia.
