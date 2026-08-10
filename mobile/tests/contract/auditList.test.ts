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
            actorDisplayName: 'Ana',
            operation: 'issue',
            environment: 'test',
            result: 'succeeded',
            requestId: 'req-1',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      }).total,
    ).toBe(1);
  });
});
