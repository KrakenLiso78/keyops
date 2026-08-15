import {
  constantTimeEqual,
  deliveryCodeDigest,
} from "../credentials/syntheticDelivery";
import { ApiError } from "../http/ApiError";
import type { AirtableClient, AirtableRecord } from "./AirtableClient";
import {
  deliveryGrantFieldsSchema,
  type DeliveryGrantFields,
  type PersistedDeliveryGrant,
} from "./operationSchema";

type DeliveryClient = Pick<
  AirtableClient,
  "list" | "create" | "update" | "updateMany"
>;

function mapGrant(
  record: AirtableRecord<DeliveryGrantFields>,
): PersistedDeliveryGrant {
  return {
    recordId: record.id,
    fields: deliveryGrantFieldsSchema.parse(record.fields),
  };
}

export class DeliveryGrantRepository {
  constructor(private readonly client: DeliveryClient) {}

  async create(fields: DeliveryGrantFields): Promise<PersistedDeliveryGrant> {
    return mapGrant(
      await this.client.create<DeliveryGrantFields>(
        "DeliveryGrants",
        deliveryGrantFieldsSchema.parse(fields),
      ),
    );
  }

  async find(deliveryId: string): Promise<PersistedDeliveryGrant | undefined> {
    const matches = (
      await this.client.list<DeliveryGrantFields>("DeliveryGrants")
    )
      .map(mapGrant)
      .filter(({ fields }) => fields.deliveryId === deliveryId);
    if (matches.length > 1) {
      throw new ApiError(
        409,
        "duplicate_delivery",
        "La entrega sintética tiene una configuración ambigua.",
      );
    }
    return matches[0];
  }

  async invalidateAvailable(
    credentialVersionId: string,
    now: string,
  ): Promise<void> {
    const available = (
      await this.client.list<DeliveryGrantFields>("DeliveryGrants")
    )
      .map(mapGrant)
      .filter(
        ({ fields }) =>
          fields.credentialVersionId === credentialVersionId &&
          !fields.consumedAt &&
          !fields.invalidatedAt,
      );
    if (available.length) {
      await this.client.updateMany<DeliveryGrantFields>(
        "DeliveryGrants",
        available.map(({ recordId }) => ({
          recordId,
          fields: { invalidatedAt: now },
        })),
      );
    }
  }

  async consume(input: {
    deliveryId: string;
    code: string;
    pepper: string;
    now: string;
  }): Promise<PersistedDeliveryGrant> {
    const grant = await this.find(input.deliveryId);
    if (!grant) {
      throw new ApiError(
        404,
        "delivery_not_found",
        "No se encontró la entrega sintética.",
      );
    }
    if (
      grant.fields.consumedAt ||
      grant.fields.invalidatedAt ||
      new Date(grant.fields.expiresAt).getTime() <=
        new Date(input.now).getTime()
    ) {
      throw new ApiError(
        410,
        "delivery_unavailable",
        "El código ha caducado, ya se utilizó o fue sustituido.",
      );
    }
    const digest = await deliveryCodeDigest(
      input.pepper,
      input.deliveryId,
      input.code,
    );
    if (!constantTimeEqual(digest, grant.fields.codeDigest)) {
      throw new ApiError(
        410,
        "delivery_unavailable",
        "El código ha caducado, ya se utilizó o fue sustituido.",
      );
    }
    return mapGrant(
      await this.client.update<DeliveryGrantFields>(
        "DeliveryGrants",
        grant.recordId,
        { consumedAt: input.now },
      ),
    );
  }
}
