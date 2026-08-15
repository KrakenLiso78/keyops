import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { AuthenticatedUser, AuthorizedUser } from '@/domain/model/user';
import type { UserRepository } from '@/domain/ports/UserRepository';
import { useUsersController } from '@/presentation/controllers/useUsersController';

const actor: AuthenticatedUser = {
  id: 'admin-1',
  loginIdentifier: 'admin-1',
  displayName: 'Admin One',
  profile: 'administrator',
  enabled: true,
  permissions: ['users:write'],
};

const target: AuthorizedUser = {
  id: 'user-2',
  corporateIssuer: 'https://identity.example.test',
  corporateSubject: 'subject-2',
  displayName: 'User Two',
  profile: 'analyst',
  enabled: true,
  permissions: ['applications:read'],
  updatedAt: '2026-08-15T10:00:00.000Z',
};

describe('administración corporativa de usuarios', () => {
  it('expone carga, actualización confirmada y error persistente', async () => {
    const repository: UserRepository = {
      list: jest.fn(async () => [target]),
      create: jest.fn(async () => target),
      update: jest
        .fn()
        .mockResolvedValueOnce({
          ...target,
          profile: 'auditor',
          permissions: ['audit:read'],
          updatedAt: '2026-08-15T10:01:00.000Z',
        })
        .mockRejectedValueOnce(new Error('La autorización ha cambiado.')),
    };
    const { result } = renderHook(() => useUsersController(actor, repository));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.users).toHaveLength(1));
    await act(async () => {
      await result.current.update(target, { profile: 'auditor', enabled: true });
    });
    expect(result.current.users[0]).toMatchObject({ profile: 'auditor' });
    await act(async () => {
      await result.current.update(result.current.users[0]!, {
        profile: 'analyst',
        enabled: true,
      });
    });
    expect(result.current.error).toContain('autorización ha cambiado');
  });

  it('registers and reloads the authoritative list', async () => {
    const repository: UserRepository = {
      list: jest.fn(async () => [target]),
      create: jest.fn(async () => target),
      update: jest.fn(async () => target),
    };
    const { result } = renderHook(() => useUsersController(actor, repository));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.register({
        corporateIssuer: target.corporateIssuer,
        corporateSubject: target.corporateSubject,
        profile: target.profile,
        enabled: true,
      });
    });
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(repository.list).toHaveBeenCalledTimes(2);
  });
});
