import { AirtableClient } from "../airtable/AirtableClient";
import { ApplicationOperationalContextRepository } from "../airtable/ApplicationOperationalContextRepository";
import { CorporateCatalogHttpAdapter } from "../catalog/CorporateCatalogHttpAdapter";
import type { ValidatedEnv } from "../config/env";

export function createWorkerDependencies(config: ValidatedEnv) {
  const airtable = new AirtableClient({
    baseId: config.airtableBaseId,
    token: config.airtablePat,
  });
  return {
    airtable,
    operationalContexts: new ApplicationOperationalContextRepository(airtable),
    catalog: config.catalog
      ? new CorporateCatalogHttpAdapter(config.catalog)
      : undefined,
  };
}
