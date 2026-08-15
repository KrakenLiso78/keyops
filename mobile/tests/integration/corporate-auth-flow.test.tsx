import type { SessionTokens } from '@/domain/model/user';
import { RestAuthRepository } from '@/data/repositories/RestAuthRepository';
import { beginCorporateSignIn } from '@/domain/use-cases/auth/beginCorporateSignIn';
import { restoreSession } from '@/domain/use-cases/auth/restoreSession';
import { signOut } from '@/domain/use-cases/auth/signOut';

class EmptySessionStore {
  read = jest.fn(async (): Promise<SessionTokens | undefined> => undefined);
  write = jest.fn(async () => undefined);
  clear = jest.fn(async () => undefined);
}

describe('flujo de identidad corporativa', () => {
  it('redirige, restaura mediante cookie y cierra sin persistir tokens OIDC', async () => {
    const user = {
      id: 'user-analyst',
      loginIdentifier: 'analyst@example.invalid',
      displayName: 'Analista corporativo',
      profile: 'analyst',
      enabled: true,
      permissions: ['applications:read'],
    };
    const request = jest.fn(async (path: string) => {
      if (path === '/v1/session') return { contractVersion: '1', user };
      return undefined;
    });
    const resolve = jest.fn((path: string) => `https://keyops.example${path}`);
    const navigate = jest.fn();
    const repository = new RestAuthRepository({ request, resolve } as never, navigate);
    const store = new EmptySessionStore();

    await beginCorporateSignIn(repository);
    expect(navigate).toHaveBeenCalledWith(
      'https://keyops.example/v1/auth/login?returnPath=%2Fapplications',
    );
    await expect(restoreSession(repository, store)).resolves.toMatchObject({
      id: 'user-analyst',
    });
    expect(store.read).not.toHaveBeenCalled();
    await signOut(repository, store);
    expect(request).toHaveBeenCalledWith('/v1/auth/logout', { method: 'POST' });
    expect(store.clear).toHaveBeenCalled();
    expect(store.write).not.toHaveBeenCalled();
  });
});
