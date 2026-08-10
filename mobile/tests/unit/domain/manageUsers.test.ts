import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import {
  createAuthorizedUser,
  listAuthorizedUsers,
  updateAuthorizedUser,
} from '@/domain/use-cases/users/manageUsers';

describe('gestión de usuarios', () => {
  const admin = fakeRepository.signIn('admin');

  it('crea, edita y lista usuarios desde el administrador', () => {
    const created = createAuthorizedUser(admin, {
      displayName: 'Nora User',
      loginIdentifier: 'nora-user',
      profile: 'analyst',
      enabled: true,
    });
    expect(updateAuthorizedUser(admin, created.id, 'auditor', false)).toMatchObject({
      profile: 'auditor',
      enabled: false,
    });
    expect(listAuthorizedUsers(admin)).toEqual(
      expect.arrayContaining([expect.objectContaining(created)]),
    );
  });

  it('no permite gestionar usuarios al analista', () => {
    expect(() => listAuthorizedUsers(fakeRepository.signIn('analista'))).toThrow('permiso');
  });
});
