import { ApiError } from "../http/ApiError";
import type { AirtableClient, AirtableRecord } from "./AirtableClient";
import {
  auditEventFieldsSchema,
  type AuditEventFields,
  type PersistedAuditEvent,
} from "../audit/auditEventSchema";

export interface AuditEventStore {
  append(fields: AuditEventFields): Promise<PersistedAuditEvent>;
  list(): Promise<PersistedAuditEvent[]>;
}

type AuditClient = Pick<AirtableClient, "list" | "create">;

function mapEvent(
  record: AirtableRecord<AuditEventFields>,
): PersistedAuditEvent {
  return {
    recordId: record.id,
    fields: auditEventFieldsSchema.parse(record.fields),
  };
}

function escapeFormula(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}

export class AuditEventRepository implements AuditEventStore {
  constructor(
    private readonly client: AuditClient,
    private readonly mode?: "fake" | "real",
  ) {}

  async append(fields: AuditEventFields): Promise<PersistedAuditEvent> {
    const validated = auditEventFieldsSchema.parse({
      ...fields,
      ...(this.mode ? { mode: this.mode } : {}),
    });
    const existing = (
      await this.client.list<AuditEventFields>("AuditEvents", {
        filterByFormula: `{eventId}='${escapeFormula(validated.eventId)}'`,
        maxRecords: "2",
      })
    ).map(mapEvent);
    if (existing.length > 1) {
      throw new ApiError(
        409,
        "duplicate_audit_event",
        "La evidencia de auditoría está duplicada.",
      );
    }
    if (existing[0]) {
      if (JSON.stringify(existing[0].fields) !== JSON.stringify(validated)) {
        throw new ApiError(
          409,
          "audit_event_conflict",
          "La evidencia de auditoría no coincide con el intento.",
        );
      }
      return existing[0];
    }
    return mapEvent(
      await this.client.create<AuditEventFields>("AuditEvents", validated),
    );
  }

  async list(): Promise<PersistedAuditEvent[]> {
    return (await this.client.list<AuditEventFields>("AuditEvents"))
      .map(mapEvent)
      .filter(
        ({ fields }) => !this.mode || !fields.mode || fields.mode === this.mode,
      );
  }
}
