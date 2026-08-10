import { requireAuditEvidence } from '@/domain/policies/auditEvidence';
describe('evidencia de auditoría', () => {
  it('exige recibo completo', () => {
    expect(
      requireAuditEvidence({ requestId: 'req', auditEventId: 'aud', result: 'succeeded' }),
    ).toMatchObject({ requestId: 'req' });
    expect(() =>
      requireAuditEvidence({ requestId: '', auditEventId: undefined, result: 'failed' }),
    ).toThrow();
  });
});
