import { RestAuditRepository } from '@/data/repositories/RestAuditRepository';
import type { FetchHttpClient } from '@/data/http/FetchHttpClient';

describe('RestAuditRepository', () => {
  it('envía únicamente filtros definidos y valida la página', async () => {
    const request = jest.fn(async () => ({
      items: [],
      nextCursor: 'cursor:40',
    }));
    const repository = new RestAuditRepository({ request } as unknown as FetchHttpClient);
    await expect(
      repository.list({
        from: '2026-08-15T00:00:00Z',
        applicationId: 'app test',
        result: 'failed',
        cursor: 'cursor:20',
      }),
    ).resolves.toMatchObject({ nextCursor: 'cursor:40' });
    expect(request).toHaveBeenCalledWith(
      '/v2/audit-events?from=2026-08-15T00%3A00%3A00Z&applicationId=app+test&result=failed&cursor=cursor%3A20',
      {
        headers: {
          accept: 'application/vnd.keyops.v2+json',
          'x-keyops-contract-version': '2',
        },
      },
      undefined,
    );
  });

  it('verifica la integridad por event id mediante el contrato v2', async () => {
    const request = jest.fn(async () => ({
      eventId: 'cmp-1',
      status: 'verified',
      verifiedAt: '2026-08-15T12:00:00Z',
      retentionUntil: '2031-08-15T12:00:00Z',
    }));
    const repository = new RestAuditRepository({ request } as unknown as FetchHttpClient);

    await expect(repository.verify('cmp/1')).resolves.toMatchObject({ status: 'verified' });
    expect(request).toHaveBeenCalledWith(
      '/v2/audit-events/cmp%2F1/integrity',
      expect.objectContaining({ headers: expect.any(Object) }),
      undefined,
    );
  });
});
