import type {
  ComplianceAppendReceipt,
  ComplianceAuditPort,
  ComplianceQuery,
  RecoveryProbeRequest,
} from "../../src/compliance/ComplianceAuditPort";
import type {
  ComplianceEvent,
  ComplianceStoredEvent,
} from "../../src/compliance/eventEnvelope";
import { readComplianceEvent } from "../../src/compliance/schemaRegistry";
import { ApiError } from "../../src/http/ApiError";

export class ComplianceAuditStub implements ComplianceAuditPort {
  private readonly records = new Map<string, ComplianceStoredEvent>();
  private loseResponse = false;
  private failBeforeEffect = false;
  private corruptRecovery = false;

  seed(input: unknown): void {
    const event = readComplianceEvent(input);
    this.records.set(event.eventId, structuredClone(event));
  }

  loseNextResponse(): void {
    this.loseResponse = true;
  }

  failNextBeforeEffect(): void {
    this.failBeforeEffect = true;
  }

  corruptNextRecovery(): void {
    this.corruptRecovery = true;
  }

  async append(
    event: ComplianceEvent,
    idempotencyKey: string,
  ): Promise<ComplianceAppendReceipt> {
    if (idempotencyKey !== event.eventId) {
      throw new ApiError(400, "invalid_idempotency_key", "Invalid key.");
    }
    const existing = this.records.get(event.eventId);
    if (existing) {
      if (existing.payloadFingerprint !== event.payloadFingerprint) {
        throw new ApiError(
          409,
          "compliance_event_conflict",
          "Conflicting event.",
        );
      }
      return receiptFor(existing);
    }
    if (this.failBeforeEffect) {
      this.failBeforeEffect = false;
      throw new ApiError(
        503,
        "compliance_store_unavailable",
        "Injected failure.",
        true,
      );
    }
    const stored: ComplianceStoredEvent = {
      ...structuredClone(event),
      integrityReference: `worm:${event.eventId}`,
      integrity: "verified",
    };
    this.records.set(event.eventId, stored);
    if (this.loseResponse) {
      this.loseResponse = false;
      throw new ApiError(
        503,
        "compliance_ack_lost",
        "Injected response loss.",
        true,
      );
    }
    return receiptFor(stored);
  }

  async get(eventId: string): Promise<ComplianceStoredEvent | undefined> {
    const event = this.records.get(eventId);
    return event ? structuredClone(event) : undefined;
  }

  async query(query: ComplianceQuery) {
    const filtered = this.events().filter(
      (event) =>
        (!query.from || event.occurredAt >= query.from) &&
        (!query.to || event.occurredAt <= query.to) &&
        (!query.applicationId || event.applicationId === query.applicationId) &&
        (!query.actorUserId || event.actorUserId === query.actorUserId) &&
        (!query.result || event.result === query.result),
    );
    const offset = query.cursor
      ? Number(query.cursor.replace(/^cursor:/u, ""))
      : 0;
    const items = filtered.slice(offset, offset + query.limit);
    const nextOffset = offset + items.length;
    return {
      items,
      nextCursor:
        nextOffset < filtered.length ? `cursor:${nextOffset}` : undefined,
    };
  }

  async verify(eventId: string) {
    const event = this.records.get(eventId);
    if (!event) {
      throw new ApiError(404, "compliance_event_not_found", "Not found.");
    }
    return {
      eventId,
      status: event.integrity,
      verifiedAt: "2026-08-15T12:30:00.000Z",
      retentionUntil: event.retentionUntil,
    };
  }

  async runRecoveryProbe(request: RecoveryProbeRequest) {
    const source = this.events().filter(
      (event) =>
        (!request.from || event.occurredAt >= request.from) &&
        (!request.to || event.occurredAt <= request.to),
    );
    const recovered = structuredClone(source);
    if (this.corruptRecovery) {
      this.corruptRecovery = false;
      recovered.pop();
    }
    return {
      runId: request.runId,
      completedAt: "2026-08-15T12:31:00.000Z",
      sourceCount: source.length,
      recoveredCount: recovered.length,
      firstEventId: recovered[0]?.eventId,
      lastEventId: recovered.at(-1)?.eventId,
      countMatches: source.length === recovered.length,
      orderMatches:
        source.map(({ eventId }) => eventId).join("|") ===
        recovered.map(({ eventId }) => eventId).join("|"),
      integrityVerified: recovered.every(
        ({ integrity }) => integrity === "verified",
      ),
    };
  }

  attemptMutation(eventId: string): never {
    if (!this.records.has(eventId)) {
      throw new ApiError(404, "compliance_event_not_found", "Not found.");
    }
    throw new ApiError(409, "immutable_event", "Event is immutable.");
  }

  events(): ComplianceStoredEvent[] {
    return [...this.records.values()]
      .sort(
        (left, right) =>
          left.occurredAt.localeCompare(right.occurredAt) ||
          left.eventId.localeCompare(right.eventId),
      )
      .map((event) => structuredClone(event));
  }
}

function receiptFor(event: ComplianceStoredEvent): ComplianceAppendReceipt {
  return {
    eventId: event.eventId,
    providerRecordId: event.integrityReference,
    acceptedAt: event.occurredAt,
    retentionUntil: event.retentionUntil,
    integrityReference: event.integrityReference,
    integrity: event.integrity,
  };
}
