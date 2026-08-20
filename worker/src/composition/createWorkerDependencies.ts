import { AirtableClient } from "../airtable/AirtableClient";
import { ApplicationOperationalContextRepository } from "../airtable/ApplicationOperationalContextRepository";
import { CorporateCatalogHttpAdapter } from "../catalog/CorporateCatalogHttpAdapter";
import type { ValidatedEnv } from "../config/env";
import { OidcHttpAdapter } from "../identity/OidcHttpAdapter";
import { RealCredentialReferenceRepository } from "../airtable/RealCredentialReferenceRepository";
import { CredentialProviderHttpAdapter } from "../credentials/real/CredentialProviderHttpAdapter";
import { SecureDeliveryHttpAdapter } from "../delivery/SecureDeliveryHttpAdapter";
import { ComplianceAuditHttpAdapter } from "../compliance/ComplianceAuditHttpAdapter";

export function createWorkerDependencies(config: ValidatedEnv) {
  const airtable = new AirtableClient({
    baseId: config.airtableBaseId,
    token: config.airtablePat,
  });
  const realReferences = new RealCredentialReferenceRepository(airtable);
  return {
    airtable,
    realReferences,
    operationalContexts: new ApplicationOperationalContextRepository(airtable),
    catalog: config.catalog
      ? new CorporateCatalogHttpAdapter(config.catalog)
      : undefined,
    oidc: config.oidc ? new OidcHttpAdapter(config.oidc) : undefined,
    realCredentials: config.realCredentials
      ? {
          provider: new CredentialProviderHttpAdapter(
            config.realCredentials.provider,
          ),
          delivery: new SecureDeliveryHttpAdapter(
            config.realCredentials.delivery,
          ),
          references: realReferences,
          allowedEnvironments: config.realCredentials.allowedEnvironments,
        }
      : undefined,
    complianceAudit: config.complianceAudit
      ? new ComplianceAuditHttpAdapter(config.complianceAudit)
      : undefined,
  };
}
