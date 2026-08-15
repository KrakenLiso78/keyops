import { sha256 } from "../credentials/syntheticDelivery";
import type { AuditAttempt } from "./AuditSink";
import { redactAudit } from "./redactAudit";
import type { AuditEventFields } from "./auditEventSchema";

function compactInstant(value: string): string {
  return value.replace(/\D/gu, "").slice(0, 17);
}

export async function createAuditEvent(
  attempt: AuditAttempt,
  occurredAt = new Date().toISOString(),
): Promise<AuditEventFields> {
  const fingerprint = await sha256(
    [
      attempt.context.requestId,
      attempt.operation,
      attempt.result,
      attempt.resourceType ?? "system",
      attempt.resourceId ?? "",
      occurredAt,
    ].join("|"),
  );
  return redactAudit({
    eventId: `evt-${compactInstant(occurredAt)}-${fingerprint.slice(0, 16)}`,
    schemaVersion: 1,
    occurredAt,
    actorUserId: attempt.actor?.id ?? attempt.context.actor?.id ?? "anonymous",
    actorDisplayName:
      attempt.actor?.displayName ??
      attempt.context.actor?.displayName ??
      "Anónimo",
    operation: attempt.operation,
    resourceType: attempt.resourceType ?? "system",
    resourceId: attempt.resourceId,
    environment: attempt.environment,
    institutionId: attempt.institutionId,
    applicationId: attempt.applicationId,
    credentialId: attempt.credentialId,
    result: attempt.result,
    originIp: attempt.context.originIp,
    failureCode: attempt.failureCode,
    requestId: attempt.context.requestId,
    operationId: attempt.operationId,
  });
}
