import type { AuthenticatedUser, SessionTokens } from '@/domain/model/user';
import type { AuthRepository } from '@/domain/ports/AuthRepository';
import { restoreSession } from '@/domain/use-cases/auth/restoreSession';
import { signIn } from '@/domain/use-cases/auth/signIn';
import { signOut } from '@/domain/use-cases/auth/signOut';
import {
  firstAllowedPath,
  requiredPermissionForPath,
} from '@/presentation/navigation/authorization';

const analyst: AuthenticatedUser = {
  id: 'user-analyst',
  loginIdentifier: 'analyst@example.invalid',
  displayName: 'Analista Demo',
  profile: 'analyst',
  enabled: true,
  permissions: ['applications:read', 'credentials:issue'],
};

class MemorySessionStore {
  tokens?: SessionTokens;
  read = jest.fn(async () => this.tokens);
  write = jest.fn(async (tokens: SessionTokens) => {
    this.tokens = tokens;
  });
  clear = jest.fn(async () => {
    this.tokens = undefined;
  });
}

const repository: AuthRepository = {
  signIn: jest.fn(async () => ({ user: analyst, tokens: { accessToken: 'signed-token' } })),
  restore: jest.fn(async () => analyst),
  signOut: jest.fn(async () => undefined),
};

describe('flujo móvil de sesión remota', () => {
  it('inicia, restaura y cierra limpiando el token', async () => {
    const store = new MemorySessionStore();
    await expect(
      signIn(repository, store, analyst.loginIdentifier, 'correct-password'),
    ).resolves.toEqual(analyst);
    expect(store.tokens).toEqual({ accessToken: 'signed-token' });
    await expect(restoreSession(repository, store)).resolves.toEqual(analyst);
    await signOut(repository, store);
    expect(store.tokens).toBeUndefined();
    expect(store.clear).toHaveBeenCalled();
  });

  it('rechaza rutas directas que no corresponden al permiso', () => {
    expect(requiredPermissionForPath('/audit')).toBe('audit:read');
    expect(analyst.permissions).not.toContain(requiredPermissionForPath('/audit'));
    expect(firstAllowedPath(analyst)).toBe('/applications');
  });
});
