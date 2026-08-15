import type { CredentialRepository } from "../airtable/CredentialRepository";
import type { DeliveryGrantRepository } from "../airtable/DeliveryGrantRepository";
import type { AuthorizedUser } from "../airtable/userSchema";
import { ApiError } from "../http/ApiError";
import { ensureSyntheticDelivery } from "./issueCredential";
import type { FullDeliveryReceipt } from "./operationService";
import { assertCredentialAction } from "./stateMachine";

export interface CreateDeliveryInput {
  user: AuthorizedUser;
  environment: "test" | "production";
  applicationId: string;
  credentialId: string;
  operationId: string;
  origin: string;
  now?: string;
  deliveryPepper: string;
  credentials: CredentialRepository;
  deliveries: DeliveryGrantRepository;
}

export async function createDelivery(
  input: CreateDeliveryInput,
): Promise<{ delivery: FullDeliveryReceipt }> {
  const now = input.now ?? new Date().toISOString();
  const aggregate = await input.credentials.findById(
    input.environment,
    input.applicationId,
    input.credentialId,
  );
  if (!aggregate) {
    throw new ApiError(
      404,
      "credential_not_found",
      "No se encontró la credencial solicitada.",
    );
  }
  assertCredentialAction({
    user: input.user,
    action: "deliver",
    state: aggregate.credential.fields.state,
  });
  const delivery = await ensureSyntheticDelivery({
    applicationId: input.applicationId,
    environment: input.environment,
    credentialVersionId: aggregate.credential.fields.currentVersionId,
    operationId: input.operationId,
    origin: input.origin,
    now,
    deliveryPepper: input.deliveryPepper,
    deliveries: input.deliveries,
  });
  await input.deliveries.invalidateAvailable(
    aggregate.credential.fields.currentVersionId,
    now,
    delivery.deliveryId,
  );
  const confirmed = await input.deliveries.find(delivery.deliveryId);
  if (!confirmed || confirmed.fields.invalidatedAt) {
    throw new ApiError(
      503,
      "delivery_reconciliation_failed",
      "No se pudo confirmar la nueva entrega.",
      true,
    );
  }
  return { delivery };
}
