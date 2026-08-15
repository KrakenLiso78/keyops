import { auditPageSchema } from '@/data/schemas/auditList';

describe('contrato de auditoría', () => {
  it('valida una página inmutable de eventos', () => {
    expect(
      auditPageSchema.parse({
        contractVersion: '1',
        items: [
          {
            id: 'aud-1',
            occurredAt: '2026-08-10T08:00:00Z',
            actorUserId: 'u-1',
            actorDisplayName: 'Ana',
            operation: 'credential.issue.v1',
            resourceType: 'credential',
            environment: 'test',
            result: 'succeeded',
            originIp: '203.0.113.80',
            requestId: 'req-1',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      }).total,
    ).toBe(1);
  });

  it('rechaza campos no publicados que podrían contener material sensible', () => {
    expect(() =>
      auditPageSchema.parse({
        contractVersion: '1',
        items: [
          {
            id: 'aud-1',
            occurredAt: '2026-08-10T08:00:00Z',
            actorUserId: 'u-1',
            actorDisplayName: 'Ana',
            operation: 'credential.issue.v1',
            resourceType: 'credential',
            result: 'succeeded',
            originIp: '203.0.113.80',
            requestId: 'req-1',
            otp: '123456',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    ).toThrow();
  });
});
