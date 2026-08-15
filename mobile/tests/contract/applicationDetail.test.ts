import { applicationDetailResponseSchema } from '@/data/schemas/applicationDetail';
describe('contrato de detalle', () => {
  it('no define clientSecret', () => {
    const parsed = applicationDetailResponseSchema.parse({
      contractVersion: '1',
      application: {
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
        clientId: 'cli',
      },
    });
    expect(parsed.application).not.toHaveProperty('clientSecret');
  });
});
