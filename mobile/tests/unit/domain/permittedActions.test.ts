import { permittedActions } from '@/domain/policies/permittedActions';
describe('acciones permitidas', () => {
  it('deniega acciones operativas al auditor', () =>
    expect(permittedActions('auditor', 'active')).toEqual([]));
  it('permite revocar solo a senior', () =>
    expect(permittedActions('senior_analyst', 'active')).toContain('revoke'));
});
