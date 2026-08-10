import { applicationDetailResponseSchema } from '@/data/schemas/applicationDetail';
describe('contrato de detalle', () => {
  it('no define clientSecret', () => {
    const parsed = applicationDetailResponseSchema.parse({
      contractVersion: '1',
      application: {
        id: 'a',
        name: 'App',
        institution: 'Institución',
        environment: 'test',
        credentialState: 'active',
        lastChangedAt: '2026-08-10T00:00:00Z',
        apiRole: 'Consulta',
        declaredIps: [],
        clientId: 'cli',
      },
    });
    expect(parsed.application).not.toHaveProperty('clientSecret');
  });
});
