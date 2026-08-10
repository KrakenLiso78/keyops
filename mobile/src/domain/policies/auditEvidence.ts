import type { OperationReceipt } from '@/domain/model/audit';
export function requireAuditEvidence(
  receipt: Pick<OperationReceipt, 'requestId' | 'result' | 'auditEventId'>,
) {
  if (!receipt.requestId || !receipt.result || !receipt.auditEventId)
    throw new Error('La operación no aporta evidencia auditable.');
  return receipt;
}
