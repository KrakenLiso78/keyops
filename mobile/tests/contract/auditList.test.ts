import { auditPageSchema } from '@/data/schemas/auditList';

describe('contrato de auditoría', () => {
  it('valida una página inmutable de eventos', () => {
    expect(
      auditPageSchema.parse({
        items: [
          {
            eventId: 'cmp-1',
            schemaVersion: 2,
            occurredAt: '2026-08-10T08:00:00Z',
            actorUserId: 'u-1',
            operation: 'credential.issue.v2',
            resourceType: 'real_credential',
            environment: 'test',
            result: 'succeeded',
            originIp: '203.0.113.80',
            requestId: 'req-1',
            integrity: 'verified',
            retentionUntil: '2031-08-10T08:00:00Z',
          },
        ],
      }).items,
    ).toHaveLength(1);
  });

  it('rechaza campos no publicados que podrían contener material sensible', () => {
    expect(() =>
      auditPageSchema.parse({
        items: [
          {
            eventId: 'cmp-1',
            schemaVersion: 2,
            occurredAt: '2026-08-10T08:00:00Z',
            actorUserId: 'u-1',
            operation: 'credential.issue.v2',
            resourceType: 'real_credential',
            result: 'succeeded',
            originIp: '203.0.113.80',
            requestId: 'req-1',
            integrity: 'verified',
            retentionUntil: '2031-08-10T08:00:00Z',
            otp: '123456',
          },
        ],
      }),
    ).toThrow();
  });
});
