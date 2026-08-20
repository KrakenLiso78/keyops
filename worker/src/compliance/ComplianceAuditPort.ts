import type {
  ComplianceEvent,
  ComplianceStoredEvent,
  IntegrityStatus,
} from "./eventEnvelope";

export interface ComplianceAppendReceipt {
  eventId: string;
  providerRecordId: string;
  acceptedAt: string;
  retentionUntil: string;
  integrityReference: string;
  integrity: IntegrityStatus;
}

export interface ComplianceQuery {
  from?: string;
  to?: string;
  applicationId?: string;
  actorUserId?: string;
  result?: "succeeded" | "failed" | "rejected";
  cursor?: string;
  limit: 20;
}

export interface ComplianceEventPage {
  items: ComplianceStoredEvent[];
  nextCursor?: string;
}

export interface ComplianceIntegrityResult {
  eventId: string;
  status: IntegrityStatus;
  verifiedAt: string;
  retentionUntil: string;
}

export interface RecoveryProbeRequest {
  runId: string;
  from?: string;
  to?: string;
}

export interface RecoveryEvidence {
  runId: string;
  completedAt: string;
  sourceCount: number;
  recoveredCount: number;
  firstEventId?: string;
  lastEventId?: string;
  countMatches: boolean;
  orderMatches: boolean;
  integrityVerified: boolean;
}

export interface ComplianceAuditPort {
  append(
    event: ComplianceEvent,
    idempotencyKey: string,
  ): Promise<ComplianceAppendReceipt>;
  get(eventId: string): Promise<ComplianceStoredEvent | undefined>;
  query(query: ComplianceQuery): Promise<ComplianceEventPage>;
  verify(eventId: string): Promise<ComplianceIntegrityResult>;
  runRecoveryProbe(request: RecoveryProbeRequest): Promise<RecoveryEvidence>;
}
