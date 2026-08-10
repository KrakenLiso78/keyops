import { listApplications } from '@/domain/use-cases/applications/listApplications';
describe('listApplications', () => {
  it('filtra, ordena y pagina', () => {
    const result = listApplications('test', { state: 'active', pageSize: 1 });
    expect(result.total).toBe(1);
    expect(result.items[0].credentialState).toBe('active');
  });
});
