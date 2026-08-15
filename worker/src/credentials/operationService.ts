import type { AuthorizedUser } from "../airtable/userSchema";
import type {
  SafeDeliveryReceipt,
  SafeOperationReceipt,
} from "../airtable/operationSchema";
import type { IdempotencyRepository } from "../airtable/IdempotencyRepository";
import { idempotencyScopeKey } from "../airtable/IdempotencyRepository";
import type { AuditSink } from "../audit/AuditSink";
import { ApiError } from "../http/ApiError";
import type { RequestContext } from "../http/requestContext";
import { deriveOneTimeCode, sha256 } from "./syntheticDelivery";

export interface FullDeliveryReceipt extends SafeDeliveryReceipt {
  otp: string;
}

export interface FullOperationReceipt extends Omit<
  SafeOperationReceipt,
  "delivery"
> {
  delivery?: FullDeliveryReceipt;
}

export interface CredentialOperationDependencies {
  idempotency: IdempotencyRepository;
  audit: AuditSink;
  deliveryPepper: string;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
}

export async function requestFingerprint(input: {
  operation: string;
  resourceId: string;
  body?: unknown;
}): Promise<string> {
  return sha256(JSON.stringify(stableValue(input)));
}

async function restoreReceipt(
  receipt: SafeOperationReceipt,
  deliveryPepper: string,
): Promise<FullOperationReceipt> {
  if (!receipt.delivery) {
    const { delivery: _delivery, ...withoutDelivery } = receipt;
    return withoutDelivery;
  }
  return {
    ...receipt,
    delivery: {
      ...receipt.delivery,
      otp: await deriveOneTimeCode(deliveryPepper, receipt.delivery.deliveryId),
    },
  };
}

function safeReceipt(receipt: FullOperationReceipt): SafeOperationReceipt {
  if (!receipt.delivery) return receipt;
  const { otp: _otp, ...delivery } = receipt.delivery;
  return { ...receipt, delivery };
}

export async function runCredentialOperation(input: {
  user: AuthorizedUser;
  environment: "test" | "production";
  idempotencyKey: string;
  operation: string;
  resourceType: string;
  resourceId: string;
  body?: unknown;
  context: RequestContext;
  dependencies: CredentialOperationDependencies;
  execute: (operationId: string) => Promise<{
    delivery?: FullDeliveryReceipt;
  }>;
}): Promise<FullOperationReceipt> {
  if (!/^[A-Za-z0-9._:-]{16,200}$/u.test(input.idempotencyKey)) {
    throw new ApiError(
      400,
      "invalid_idempotency_key",
      "La clave idempotente no es válida.",
    );
  }
  const now = new Date().toISOString();
  const scopeKey = await idempotencyScopeKey({
    userId: input.user.id,
    environment: input.environment,
    key: input.idempotencyKey,
  });
  const fingerprint = await requestFingerprint({
    operation: input.operation,
    resourceId: input.resourceId,
    body: input.body,
  });
  const reservation = await input.dependencies.idempotency.reserve({
    scopeKey,
    requestFingerprint: fingerprint,
    operationId: crypto.randomUUID(),
    now,
  });
  if (reservation.record.fields.status === "committed") {
    return restoreReceipt(
      input.dependencies.idempotency.receipt(reservation.record),
      input.dependencies.deliveryPepper,
    );
  }
  if (reservation.record.fields.status === "failed") {
    throw new ApiError(
      409,
      reservation.record.fields.failureCode ?? "idempotent_operation_failed",
      "La solicitud ya fue rechazada y no se repetirá.",
    );
  }

  try {
    const result = await input.execute(reservation.record.fields.operationId);
    const audit = await input.dependencies.audit.append({
      actor: input.user,
      operation: input.operation,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      environment: input.environment,
      result: "succeeded",
      context: input.context,
    });
    const receipt: FullOperationReceipt = {
      operationId: reservation.record.fields.operationId,
      requestId: input.context.requestId,
      auditEventId: audit.auditEventId,
      result: "succeeded",
      delivery: result.delivery,
    };
    await input.dependencies.idempotency.commit(
      reservation.record,
      safeReceipt(receipt),
      new Date().toISOString(),
    );
    return receipt;
  } catch (error) {
    const controlled =
      error instanceof ApiError
        ? error
        : new ApiError(
            500,
            "unexpected_error",
            "No se pudo completar la operación.",
            true,
          );
    await input.dependencies.audit.append({
      actor: input.user,
      operation: input.operation,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      environment: input.environment,
      result: controlled.status < 500 ? "rejected" : "failed",
      failureCode: controlled.code,
      context: input.context,
    });
    if (controlled.status < 500) {
      await input.dependencies.idempotency.markFailed(
        reservation.record,
        controlled.code,
        new Date().toISOString(),
      );
    }
    throw controlled;
  }
}
