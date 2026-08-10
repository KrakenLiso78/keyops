import type { EntityId, Environment, Instant } from './common';
import type { ProtectedDelivery } from './delivery';
export type OperationResult = 'succeeded' | 'failed' | 'rejected';
export interface AuditEvent {
  id: EntityId;
  occurredAt: Instant;
  actorUserId: EntityId;
  actorDisplayName: string;
  operation: string;
  environment?: Environment;
  institutionId?: EntityId;
  applicationId?: EntityId;
  credentialId?: EntityId;
  result: OperationResult;
  originIp: string;
  failureCause?: string;
  requestId: string;
}
export interface OperationReceipt {
  operationId: EntityId;
  requestId: string;
  auditEventId?: EntityId;
  result: OperationResult;
  delivery?: ProtectedDelivery;
}
