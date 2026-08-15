import type { CredentialRepository } from "../airtable/CredentialRepository";
import type { DeliveryGrantRepository } from "../airtable/DeliveryGrantRepository";
import { ApiError } from "../http/ApiError";
import {
  createSyntheticArtifact,
  type SyntheticArtifact,
} from "./syntheticDelivery";

export interface ConsumeDeliveryInput {
  deliveryId: string;
  code: string;
  now?: string;
  deliveryPepper: string;
  credentials: CredentialRepository;
  deliveries: DeliveryGrantRepository;
}

function unavailable(): ApiError {
  return new ApiError(
    410,
    "delivery_unavailable",
    "El código ha caducado, ya se utilizó o fue sustituido.",
  );
}

export async function consumeDelivery(
  input: ConsumeDeliveryInput,
): Promise<SyntheticArtifact> {
  const now = input.now ?? new Date().toISOString();
  const grant = await input.deliveries.find(input.deliveryId);
  if (!grant) {
    throw unavailable();
  }
  const aggregate = await input.credentials.findByApplication(
    grant.fields.environment,
    grant.fields.applicationId,
  );
  if (
    !aggregate ||
    aggregate.credential.fields.state !== "active" ||
    aggregate.credential.fields.currentVersionId !==
      grant.fields.credentialVersionId
  ) {
    throw unavailable();
  }
  await input.deliveries.consume({
    deliveryId: input.deliveryId,
    code: input.code,
    pepper: input.deliveryPepper,
    now,
  });
  const confirmed = await input.credentials.findByApplication(
    grant.fields.environment,
    grant.fields.applicationId,
  );
  if (
    !confirmed ||
    confirmed.credential.fields.state !== "active" ||
    confirmed.credential.fields.currentVersionId !==
      grant.fields.credentialVersionId
  ) {
    throw unavailable();
  }
  return createSyntheticArtifact(
    grant.fields.applicationId,
    grant.fields.credentialVersionId,
    now,
  );
}
