import { RestApplicationRepository } from '@/data/repositories/RestApplicationRepository';

const apiApplication = {
  id: 'app-1',
  name: 'Pago en Línea',
  institution: { id: 'inst-1', name: 'Ministerio de Salud' },
  environment: 'test',
  apiRole: { id: 'role-1', name: 'Mensajes', serviceIdentifiers: ['messages'] },
  declaredIps: ['10.1.2.3'],
  management: { technicalContact: { name: 'Ana Ruiz' }, reason: 'Alta' },
  credentialState: 'active',
  stateHistory: [],
  lastChangedAt: '2026-08-15T09:00:00.000Z',
  updatedAt: '2026-08-15T09:00:00.000Z',
};

describe('RestApplicationRepository', () => {
  it('maps the list allowlist and forwards filters', async () => {
    const http = {
      request: jest.fn().mockResolvedValue({
        contractVersion: '1',
        items: [apiApplication],
        page: 1,
        pageSize: 20,
        total: 1,
      }),
    };
    const repository = new RestApplicationRepository(http as never);
    await expect(
      repository.list('test', { query: 'pago', state: 'active' }),
    ).resolves.toMatchObject({
      total: 1,
      items: [{ institution: 'Ministerio de Salud', technicalContact: 'Ana Ruiz' }],
    });
    expect(http.request.mock.calls[0]![0]).toContain('environment=test');
    expect(http.request.mock.calls[0]![0]).toContain('query=pago');
    expect(http.request.mock.calls[0]![0]).toContain('state=active');
  });

  it('sends the persisted version and validates the response', async () => {
    const http = {
      request: jest.fn().mockResolvedValue({ contractVersion: '1', application: apiApplication }),
    };
    const repository = new RestApplicationRepository(http as never);
    await repository.updateManagement('test', 'app-1', {
      technicalContact: { name: 'Ana Ruiz' },
      reason: 'Alta',
      expectedUpdatedAt: apiApplication.updatedAt,
    });
    expect(http.request.mock.calls[0]![1]).toMatchObject({
      method: 'PATCH',
      headers: { 'if-match': `"${apiApplication.updatedAt}"` },
    });
  });
});
