import { ApiError } from "../http/ApiError";
import type { AirtableClient, AirtableRecord } from "./AirtableClient";
import {
  realCredentialReferenceFieldsSchema,
  realOperationReceiptFieldsSchema,
  type RealCredentialReferenceFields,
  type RealOperationReceipt,
  type RealOperationReceiptFields,
} from "../credentials/real/realCredentialSchemas";

type Client = Pick<AirtableClient, "list" | "create" | "update">;

export interface PersistedRealCredentialReference {
  recordId: string;
  fields: RealCredentialReferenceFields;
}

export interface PersistedRealOperationReceipt {
  recordId: string;
  fields: RealOperationReceiptFields;
}

function mapReference(
  record: AirtableRecord<RealCredentialReferenceFields>,
): PersistedRealCredentialReference {
  return {
    recordId: record.id,
    fields: realCredentialReferenceFieldsSchema.parse(record.fields),
  };
}

function mapReceipt(
  record: AirtableRecord<RealOperationReceiptFields>,
): PersistedRealOperationReceipt {
  return {
    recordId: record.id,
    fields: realOperationReceiptFieldsSchema.parse(record.fields),
  };
}

export class RealCredentialReferenceRepository {
  constructor(private readonly client: Client) {}

  async listReferences(): Promise<RealCredentialReferenceFields[]> {
    return (
      await this.client.list<RealCredentialReferenceFields>(
        "RealCredentialReferences",
      )
    ).map((record) => mapReference(record).fields);
  }

  async findByApplication(
    environment: "test" | "production",
    applicationId: string,
  ): Promise<PersistedRealCredentialReference | undefined> {
    return this.uniqueReference(
      (fields) =>
        fields.environment === environment &&
        fields.catalogApplicationId === applicationId,
    );
  }

  async findByReference(
    environment: "test" | "production",
    applicationId: string,
    referenceId: string,
  ): Promise<PersistedRealCredentialReference | undefined> {
    return this.uniqueReference(
      (fields) =>
        fields.environment === environment &&
        fields.catalogApplicationId === applicationId &&
        fields.referenceId === referenceId,
    );
  }

  async saveReference(
    fields: RealCredentialReferenceFields,
  ): Promise<PersistedRealCredentialReference> {
    const parsed = realCredentialReferenceFieldsSchema.parse(fields);
    const existing = await this.findByApplication(
      parsed.environment,
      parsed.catalogApplicationId,
    );
    if (
      existing &&
      existing.fields.externalCredentialId !== parsed.externalCredentialId
    ) {
      throw new ApiError(
        409,
        "real_credential_reference_conflict",
        "La aplicación ya referencia otra credencial real.",
      );
    }
    return mapReference(
      existing
        ? await this.client.update<RealCredentialReferenceFields>(
            "RealCredentialReferences",
            existing.recordId,
            parsed,
          )
        : await this.client.create<RealCredentialReferenceFields>(
            "RealCredentialReferences",
            parsed,
          ),
    );
  }

  async reserveReceipt(input: {
    operationId: string;
    idempotencyScopeHash: string;
    requestFingerprint: string;
    requestId: string;
    actorUserId: string;
    catalogApplicationId: string;
    environment: "test" | "production";
    referenceId?: string;
    action: RealOperationReceiptFields["action"];
    now: string;
  }): Promise<{ receipt: PersistedRealOperationReceipt; created: boolean }> {
    const existing = await this.findReceiptByScope(input.idempotencyScopeHash);
    if (existing) {
      this.assertMatchingFingerprint(existing, input.requestFingerprint);
      return { receipt: existing, created: false };
    }
    const created = mapReceipt(
      await this.client.create<RealOperationReceiptFields>(
        "RealOperationReceipts",
        {
          operationId: input.operationId,
          providerOperationId: input.operationId,
          idempotencyScopeHash: input.idempotencyScopeHash,
          requestFingerprint: input.requestFingerprint,
          requestId: input.requestId,
          actorUserId: input.actorUserId,
          catalogApplicationId: input.catalogApplicationId,
          environment: input.environment,
          referenceId: input.referenceId,
          action: input.action,
          status: "pending",
          result: "pending",
          createdAt: input.now,
          updatedAt: input.now,
          schemaVersion: "2",
        },
      ),
    );
    const winner = await this.findReceiptByScope(input.idempotencyScopeHash);
    if (!winner) return { receipt: created, created: true };
    this.assertMatchingFingerprint(winner, input.requestFingerprint);
    return {
      receipt: winner,
      created: winner.recordId === created.recordId,
    };
  }

  async findReceiptByOperation(
    operationId: string,
  ): Promise<PersistedRealOperationReceipt | undefined> {
    const matches = (
      await this.client.list<RealOperationReceiptFields>(
        "RealOperationReceipts",
      )
    )
      .map(mapReceipt)
      .filter(({ fields }) => fields.operationId === operationId);
    if (matches.length > 1) {
      throw new ApiError(
        409,
        "duplicate_real_operation",
        "La operación real tiene receipts duplicados.",
      );
    }
    return matches[0];
  }

  async updateReceipt(
    receipt: PersistedRealOperationReceipt,
    fields: Partial<RealOperationReceiptFields>,
  ): Promise<PersistedRealOperationReceipt> {
    return mapReceipt(
      await this.client.update<RealOperationReceiptFields>(
        "RealOperationReceipts",
        receipt.recordId,
        fields,
      ),
    );
  }

  toSafeReceipt(receipt: PersistedRealOperationReceipt): RealOperationReceipt {
    if (receipt.fields.status === "pending") {
      throw new ApiError(
        409,
        "real_operation_pending",
        "La operación todavía requiere reconciliación.",
        true,
      );
    }
    return {
      operationId: receipt.fields.operationId,
      requestId: receipt.fields.requestId,
      status: receipt.fields.status,
      result:
        receipt.fields.result === "pending" ? "failed" : receipt.fields.result,
      auditEventId: receipt.fields.auditEventId,
      delivery:
        receipt.fields.deliveryReferenceId && receipt.fields.deliveryExpiresAt
          ? {
              deliveryId: receipt.fields.deliveryReferenceId,
              expiresAt: receipt.fields.deliveryExpiresAt,
            }
          : undefined,
    };
  }

  private async findReceiptByScope(
    scopeHash: string,
  ): Promise<PersistedRealOperationReceipt | undefined> {
    const matches = (
      await this.client.list<RealOperationReceiptFields>(
        "RealOperationReceipts",
      )
    )
      .map(mapReceipt)
      .filter(({ fields }) => fields.idempotencyScopeHash === scopeHash);
    if (matches.length > 1) {
      throw new ApiError(
        409,
        "duplicate_real_idempotency_record",
        "La operación real tiene reservas idempotentes duplicadas.",
      );
    }
    return matches[0];
  }

  private async uniqueReference(
    predicate: (fields: RealCredentialReferenceFields) => boolean,
  ): Promise<PersistedRealCredentialReference | undefined> {
    const matches = (
      await this.client.list<RealCredentialReferenceFields>(
        "RealCredentialReferences",
      )
    )
      .map(mapReference)
      .filter(({ fields }) => predicate(fields));
    if (matches.length > 1) {
      throw new ApiError(
        409,
        "duplicate_real_credential_reference",
        "La aplicación tiene referencias reales duplicadas.",
      );
    }
    return matches[0];
  }

  private assertMatchingFingerprint(
    receipt: PersistedRealOperationReceipt,
    fingerprint: string,
  ): void {
    if (receipt.fields.requestFingerprint !== fingerprint) {
      throw new ApiError(
        409,
        "idempotency_conflict",
        "La clave idempotente ya se usó con otra solicitud.",
      );
    }
  }
}
