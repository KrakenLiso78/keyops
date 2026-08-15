import type { AuditEventStore } from "../airtable/AuditEventRepository";
import type { AuditAttempt, AuditSink } from "./AuditSink";
import { createAuditEvent } from "./auditEventFactory";

export class AuditRecorder implements AuditSink {
  constructor(
    private readonly repository: AuditEventStore,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  async append(attempt: AuditAttempt): Promise<{ auditEventId: string }> {
    const event = await createAuditEvent(attempt, this.now());
    const persisted = await this.repository.append(event);
    return { auditEventId: persisted.fields.eventId };
  }
}
