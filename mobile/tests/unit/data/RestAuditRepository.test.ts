import { RestAuditRepository } from '@/data/repositories/RestAuditRepository';
import type { FetchHttpClient } from '@/data/http/FetchHttpClient';

describe('RestAuditRepository', () => {
  it('envía únicamente filtros definidos y valida la página', async () => {
    const request = jest.fn(async () => ({
      contractVersion: '1',
      items: [],
      page: 2,
      pageSize: 20,
      total: 0,
    }));
    const repository = new RestAuditRepository({ request } as unknown as FetchHttpClient);
    await expect(
      repository.list({
        from: '2026-08-15T00:00:00Z',
        applicationId: 'app test',
        result: 'failed',
        page: 2,
      }),
    ).resolves.toMatchObject({ page: 2, total: 0 });
    expect(request).toHaveBeenCalledWith(
      '/v1/audit-events?page=2&from=2026-08-15T00%3A00%3A00Z&applicationId=app+test&result=failed',
      {},
      undefined,
    );
  });
});
