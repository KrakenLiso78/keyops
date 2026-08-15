import type { AuditAttempt, AuditSink } from "../audit/AuditSink";
import { ApiError } from "./ApiError";

type AttemptBase = Omit<AuditAttempt, "result" | "failureCode">;

export interface CompletedOperation<T> {
  value: T;
  auditEventId: string;
}

function controlledError(error: unknown): ApiError {
  return error instanceof ApiError
    ? error
    : new ApiError(
        500,
        "unexpected_error",
        "No se pudo completar la operación.",
        true,
      );
}

export async function completeOperation<T>(input: {
  audit: AuditSink;
  attempt: AttemptBase;
  execute: () => Promise<T>;
  existingAuditEventId?: string;
}): Promise<CompletedOperation<T>> {
  let value: T;
  try {
    value = await input.execute();
  } catch (error) {
    const controlled = controlledError(error);
    await input.audit.append({
      ...input.attempt,
      result: controlled.status < 500 ? "rejected" : "failed",
      failureCode: controlled.code,
    });
    throw controlled;
  }
  if (input.existingAuditEventId) {
    return { value, auditEventId: input.existingAuditEventId };
  }
  const audit = await input.audit.append({
    ...input.attempt,
    result: "succeeded",
  });
  return { value, auditEventId: audit.auditEventId };
}
