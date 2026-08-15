import { applicationPageSchema } from '@/data/schemas/applicationList';
describe('contrato de inventario', () => {
  it('valida página y ambiente', () =>
    expect(
      applicationPageSchema.parse({
        contractVersion: '1',
        items: [
          {
            id: 'a',
            name: 'App',
            institution: { id: 'inst-a', name: 'Institución' },
            environment: 'test',
            apiRole: { id: 'role-a', name: 'Consulta', serviceIdentifiers: [] },
            declaredIps: [],
            management: {},
            credentialState: 'active',
            stateHistory: [],
            lastChangedAt: '2026-08-10T00:00:00Z',
            updatedAt: '2026-08-10T00:00:00Z',
          },
        ],
        page: 1,
        pageSize: 20,
        total: 1,
      }).total,
    ).toBe(1));
});
