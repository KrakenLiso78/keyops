import type { AuthenticatedUser } from '@/domain/model/user';
import type { AuditRepository } from '@/domain/ports/AuditRepository';
import { listAuditEvents } from '@/domain/use-cases/audit/listAuditEvents';
import { permissionsForProfile } from '@/domain/policies/profilePermissions';

const repository: AuditRepository = {
  list: jest.fn(async () => ({ items: [], page: 1, pageSize: 20, total: 0 })),
};

function user(profile: AuthenticatedUser['profile']): AuthenticatedUser {
  return {
    id: `user-${profile}`,
    loginIdentifier: `${profile}@example.invalid`,
    displayName: profile,
    profile,
    enabled: true,
    permissions: permissionsForProfile(profile),
  };
}

describe('consulta de auditoría', () => {
  it.each(['senior_analyst', 'administrator', 'auditor'] as const)(
    'autoriza el perfil %s mediante su permiso explícito',
    async (profile) => {
      await expect(
        listAuditEvents(repository, user(profile), { result: 'rejected' }),
      ).resolves.toMatchObject({ pageSize: 20 });
      expect(repository.list).toHaveBeenCalledWith({ result: 'rejected' }, undefined);
    },
  );

  it('rechaza al analista antes de consultar el repositorio', async () => {
    const analyst = user('analyst');
    const isolated: AuditRepository = { list: jest.fn() };
    await expect(listAuditEvents(isolated, analyst)).rejects.toThrow('permiso');
    expect(isolated.list).not.toHaveBeenCalled();
  });
});
