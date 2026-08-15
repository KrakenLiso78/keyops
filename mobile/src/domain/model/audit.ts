import type { EntityId, Environment, Instant } from './common';
import type { OperationDelivery } from './delivery';
export type OperationResult = 'succeeded' | 'failed' | 'rejected';
export interface AuditEvent {
  id: EntityId;
  occurredAt: Instant;
  actorUserId: EntityId;
  actorDisplayName: string;
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
}

export interface AuditFilters {
  from?: Instant;
  to?: Instant;
  institutionId?: EntityId;
  applicationId?: EntityId;
  actorUserId?: EntityId;
  result?: OperationResult;
  page?: number;
}
export interface OperationReceipt {
  operationId: EntityId;
  requestId: string;
  auditEventId?: EntityId;
  result: OperationResult;
  status?: 'confirmed' | 'reconciliation_required';
  delivery?: OperationDelivery;
}
