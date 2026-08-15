import type { AuditEventStore } from "../../src/airtable/AuditEventRepository";
import type {
  AuditEventFields,
  PersistedAuditEvent,
} from "../../src/audit/auditEventSchema";

export class InMemoryAuditRepository implements AuditEventStore {
  private readonly events: PersistedAuditEvent[] = [];
  failAppend = false;

  async append(fields: AuditEventFields): Promise<PersistedAuditEvent> {
    if (this.failAppend) throw new Error("simulated audit append failure");
    const existing = this.events.find(
      (event) => event.fields.eventId === fields.eventId,
    );
    if (existing) return structuredClone(existing);
    const persisted = {
      recordId: `rec-audit-${String(this.events.length + 1).padStart(4, "0")}`,
      fields: structuredClone(fields),
    };
    this.events.push(persisted);
    return structuredClone(persisted);
  }

  async list(): Promise<PersistedAuditEvent[]> {
    return structuredClone(this.events);
  }
}
