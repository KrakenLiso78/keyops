import { ApiError } from "../http/ApiError";
import { safeDeliveryReferenceSchema } from "../credentials/real/realCredentialSchemas";
import type {
  SafeDeliveryReference,
  SecureDeliveryPort,
} from "./SecureDeliveryPort";

export async function prepareSecureDelivery(input: {
  delivery: SecureDeliveryPort;
  operationId: string;
  sealedDeliveryHandle: string;
  now?: () => number;
}): Promise<SafeDeliveryReference> {
  const prepared = safeDeliveryReferenceSchema.parse(
    await input.delivery.prepare({
      operationId: input.operationId,
      sealedDeliveryHandle: input.sealedDeliveryHandle,
    }),
  );
  if (new Date(prepared.expiresAt).getTime() <= (input.now ?? Date.now)()) {
    throw new ApiError(
      503,
      "delivery_expired_on_creation",
      "La entrega protegida no tiene una vigencia válida.",
      true,
    );
  }
  return prepared;
}
