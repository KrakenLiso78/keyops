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

Run `RUN_AIRTABLE_INTEGRATION=1 npm run test:integration:airtable`. The scenario updates a
management context, destroys the first repository/client, reads the same application from a new
client and then restores the original ticket. Capture the request count and do not run this command
without a base-scoped write PAT.

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
- 2026-08-15: `worker/npm run validate` completó tipo, 6 pruebas legacy, 10 ficheros Vitest
  locales y 13 pruebas de contrato. La simulación de cuota devolvió `429` controlado tras reintentos
  y no activó datos fake.
- 2026-08-15: `mobile/npm run validate` completó Expo Doctor 21/21, lint, formato, tipos,
  85 suites y 146 tests, contrato local y exportación web de 20 rutas. `npm run test:e2e` añadió
  4 recorridos en viewports 390×844 y 360×800.
- 2026-08-20: `RUN_AIRTABLE_INTEGRATION=1 npx vitest run
tests/integration/airtable-application-management.test.ts` actualizó una gestión, rechazó la
  escritura obsoleta, la releyó desde un cliente nuevo y restauró el ticket original en Airtable.
- El escenario persistente consumió exactamente 25 peticiones observadas, conforme al presupuesto
  de T035 y sin polling ni fallback fake.
