import type { AuditEventStore } from "../airtable/AuditEventRepository";
import type { AuditAttempt, AuditSink } from "./AuditSink";
import { createAuditEvent } from "./auditEventFactory";
import { ApiError } from "../http/ApiError";
import { markAuditRecorded } from "../http/requestContext";

export class AuditRecorder implements AuditSink {
  constructor(
    private readonly repository: AuditEventStore,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async append(attempt: AuditAttempt): Promise<{ auditEventId: string }> {
    if (attempt.operationId) {
      const matches = (await this.repository.list()).filter(
        ({ fields }) =>
          fields.operationId === attempt.operationId &&
          fields.operation === attempt.operation &&
          fields.result === attempt.result,
      );
      if (matches.length > 1) {
        throw new ApiError(
          409,
          "duplicate_operation_audit",
          "La operación tiene más de una evidencia de auditoría.",
        );
      }
      if (matches[0]) {
        markAuditRecorded(attempt.context);
        return { auditEventId: matches[0].fields.eventId };
      }
    }
    const event = await createAuditEvent(attempt, this.now());
    const persisted = await this.repository.append(event);
    markAuditRecorded(attempt.context);
    return { auditEventId: persisted.fields.eventId };
  }
}
