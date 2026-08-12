import { fakeApplications } from '@/data/fake/seed';
import { listApplications } from '@/domain/use-cases/applications/listApplications';

describe('listApplications', () => {
  it('filtra, ordena y pagina', () => {
    const result = listApplications('test', { state: 'active', pageSize: 1 });
    const expectedTotal = fakeApplications.filter(
      (application) =>
        application.environment === 'test' && application.credentialState === 'active',
    ).length;

    expect(result.total).toBe(expectedTotal);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].credentialState).toBe('active');
  });
});
