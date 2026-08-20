import type { AuditAttempt } from "../audit/AuditSink";
import { ApiError } from "../http/ApiError";
import { markAuditRecorded } from "../http/requestContext";
import type { ComplianceAuditPort } from "./ComplianceAuditPort";
import type { ComplianceEvent } from "./eventEnvelope";
import { complianceFingerprint, retentionUntilFor } from "./integrity";
import { reconcileAudit } from "../audit/reconcileAudit";
import { redactComplianceEvent } from "./redactComplianceEvent";

export async function buildComplianceEvent(
  attempt: AuditAttempt,
  occurredAt = attempt.context.startedAt,
): Promise<ComplianceEvent> {
  const core = {
    schemaVersion: 2 as const,
    occurredAt,
    actorUserId: attempt.actor?.id ?? attempt.context.actor?.id ?? "anonymous",
    operation: attempt.operation,
    resourceType: attempt.resourceType ?? "system",
    resourceId: attempt.resourceId,
    environment: attempt.environment,
    result: attempt.result,
    failureCode: attempt.failureCode,
    originIp: attempt.context.originIp,
    requestId: attempt.context.requestId,
    operationId: attempt.operationId,
    applicationId: attempt.applicationId,
    retentionUntil: retentionUntilFor(occurredAt),
  };
  const payloadFingerprint = await complianceFingerprint(core);
  const eventId = `cmp-${(
    await complianceFingerprint({
      requestId: core.requestId,
      operation: core.operation,
      result: core.result,
      resourceType: core.resourceType,
      resourceId: core.resourceId,
      operationId: core.operationId,
    })
  ).slice(0, 32)}`;
  return redactComplianceEvent({
    eventId,
    ...core,
    payloadFingerprint,
  });
}

export async function appendComplianceEvent(input: {
  port: ComplianceAuditPort;
  attempt: AuditAttempt;
  occurredAt?: string;
}): Promise<{ auditEventId: string }> {
  const event = await buildComplianceEvent(input.attempt, input.occurredAt);
  try {
    const receipt = await input.port.append(event, event.eventId);
    assertReceipt(event, receipt);
  } catch (error) {
    if (!(error instanceof ApiError) || !error.retryable) throw error;
    await reconcileAudit(input.port, event);
  }
  markAuditRecorded(input.attempt.context);
  return { auditEventId: event.eventId };
}

export async function recordComplianceTamperAttempt(input: {
  port: ComplianceAuditPort;
  attempt: Omit<AuditAttempt, "operation" | "resourceType" | "result">;
  targetEventId: string;
  occurredAt?: string;
}) {
  return appendComplianceEvent({
    port: input.port,
    occurredAt: input.occurredAt,
    attempt: {
      ...input.attempt,
      operation: "audit.tamper_attempt.v2",
      resourceType: "compliance_event",
      resourceId: input.targetEventId,
      result: "rejected",
      failureCode: "immutable_event",
    },
  });
}

function assertReceipt(
  event: ComplianceEvent,
  receipt: Awaited<ReturnType<ComplianceAuditPort["append"]>>,
): void {
  if (
    receipt.eventId !== event.eventId ||
    receipt.retentionUntil !== event.retentionUntil ||
    receipt.integrity !== "verified"
  ) {
    throw new ApiError(
      503,
      "invalid_compliance_receipt",
      "El almacén no confirmó una evidencia íntegra y retenida.",
      true,
    );
  }
}
