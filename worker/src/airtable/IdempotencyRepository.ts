import { ApiError } from "../http/ApiError";
import { sha256 } from "../credentials/syntheticDelivery";
import type { AirtableClient, AirtableRecord } from "./AirtableClient";
import {
  idempotencyFieldsSchema,
  safeOperationReceiptSchema,
  type IdempotencyFields,
  type PersistedIdempotencyRecord,
  type SafeOperationReceipt,
} from "./operationSchema";

type IdempotencyClient = Pick<AirtableClient, "list" | "create" | "update">;

function mapRecord(
  record: AirtableRecord<IdempotencyFields>,
): PersistedIdempotencyRecord {
  return {
    recordId: record.id,
    fields: idempotencyFieldsSchema.parse(record.fields),
  };
}

export async function idempotencyScopeKey(input: {
  userId: string;
  environment: "test" | "production";
  key: string;
}): Promise<string> {
  return sha256(`${input.userId}:${input.environment}:${input.key}`);
}

export class IdempotencyRepository {
  constructor(private readonly client: IdempotencyClient) {}

  async reserve(input: {
    scopeKey: string;
    requestFingerprint: string;
    operationId: string;
    now: string;
  }): Promise<{ record: PersistedIdempotencyRecord; created: boolean }> {
    const existing = await this.find(input.scopeKey);
    if (existing) {
      if (existing.fields.requestFingerprint !== input.requestFingerprint) {
        throw new ApiError(
          409,
          "idempotency_conflict",
          "La clave idempotente ya se usó con otra solicitud.",
        );
      }
      return { record: existing, created: false };
    }
    const expiresAt = new Date(
      new Date(input.now).getTime() + 24 * 60 * 60 * 1_000,
    ).toISOString();
    const created = mapRecord(
      await this.client.create<IdempotencyFields>("IdempotencyRecords", {
        ...input,
        status: "processing",
        expiresAt,
        createdAt: input.now,
        updatedAt: input.now,
        schemaVersion: "1",
      }),
    );
    const winner = await this.find(input.scopeKey);
    if (!winner || winner.recordId !== created.recordId) {
      if (winner?.fields.requestFingerprint !== input.requestFingerprint) {
        throw new ApiError(
          409,
          "idempotency_conflict",
          "La clave idempotente ya se usó con otra solicitud.",
        );
      }
      return { record: winner ?? created, created: false };
    }
    return { record: created, created: true };
  }

  async commit(
    record: PersistedIdempotencyRecord,
    receipt: SafeOperationReceipt,
    now: string,
  ): Promise<PersistedIdempotencyRecord> {
    return mapRecord(
      await this.client.update<IdempotencyFields>(
        "IdempotencyRecords",
        record.recordId,
        {
          status: "committed",
          receiptJson: JSON.stringify(
            safeOperationReceiptSchema.parse(receipt),
          ),
          failureCode: undefined,
          updatedAt: now,
        },
      ),
    );
  }

  async markFailed(
    record: PersistedIdempotencyRecord,
    failureCode: string,
    now: string,
  ): Promise<void> {
    await this.client.update<IdempotencyFields>(
      "IdempotencyRecords",
      record.recordId,
      { status: "failed", failureCode, updatedAt: now },
    );
  }

  receipt(record: PersistedIdempotencyRecord): SafeOperationReceipt {
    if (!record.fields.receiptJson) {
      throw new ApiError(
        503,
        "invalid_persisted_data",
        "El resultado idempotente no está disponible.",
      );
    }
    try {
      return safeOperationReceiptSchema.parse(
        JSON.parse(record.fields.receiptJson),
      );
    } catch {
      throw new ApiError(
        503,
        "invalid_persisted_data",
        "El resultado idempotente no es válido.",
      );
    }
  }

  private async find(
    scopeKey: string,
  ): Promise<PersistedIdempotencyRecord | undefined> {
    const matches = (
      await this.client.list<IdempotencyFields>("IdempotencyRecords")
    )
      .map(mapRecord)
      .filter(({ fields }) => fields.scopeKey === scopeKey)
      .toSorted((left, right) => left.recordId.localeCompare(right.recordId));
    if (matches.length > 1) {
      throw new ApiError(
        409,
        "duplicate_idempotency_record",
        "La operación idempotente tiene reservas duplicadas.",
      );
    }
    return matches[0];
  }
}
