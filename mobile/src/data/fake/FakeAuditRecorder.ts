import type { AuditEvent, Receipt } from '@/domain/model/types';
export function createFakeAuditEvent(
  operation: string,
  result: Receipt['result'],
  requestId: string,
): AuditEvent {
  return {
    id: `aud-${requestId}`,
    occurredAt: new Date().toISOString(),
    actorDisplayName: 'Sistema fake',
    operation: operation as AuditEvent['operation'],
    environment: 'test',
    result,
    requestId,
  };
}
