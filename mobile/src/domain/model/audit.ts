import type { EntityId, Environment, Instant } from './common';
import type { OperationDelivery } from './delivery';
export type OperationResult = 'succeeded' | 'failed' | 'rejected';
export type IntegrityStatus = 'verified' | 'failed' | 'unavailable';
export interface AuditEvent {
  id: EntityId;
  schemaVersion: number;
  occurredAt: Instant;
  actorUserId: EntityId;
  actorDisplayName?: string;
  operation: string;
  resourceType: string;
  resourceId?: EntityId;
  environment?: Environment;
  institutionId?: EntityId;
  applicationId?: EntityId;
  credentialId?: EntityId;
  result: OperationResult;
  originIp: string;
  failureCause?: string;
  requestId: string;
  integrity: IntegrityStatus;
  retentionUntil: Instant;
}

export interface AuditFilters {
  from?: Instant;
  to?: Instant;
  applicationId?: EntityId;
  actorUserId?: EntityId;
  result?: OperationResult;
  cursor?: string;
}

export interface AuditPage {
  items: AuditEvent[];
  nextCursor?: string;
}

export interface IntegrityVerification {
  eventId: EntityId;
  status: IntegrityStatus;
  verifiedAt: Instant;
  retentionUntil: Instant;
}
export interface OperationReceipt {
  operationId: EntityId;
  requestId: string;
  auditEventId?: EntityId;
  result: OperationResult;
  status?: 'confirmed' | 'reconciliation_required';
  delivery?: OperationDelivery;
}
