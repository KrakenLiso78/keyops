import { fakeRepository } from './FakeKeyOpsRepository';
import type { AuthRepository } from '@/domain/ports/AuthRepository';
import type { AuthenticatedUser } from '@/domain/model/user';
import { permissionsForProfile } from '@/domain/policies/profilePermissions';
let activeFakeUser: AuthenticatedUser | undefined;
export class FakeAuthRepository implements AuthRepository {
  readonly mode = 'credentials' as const;

  async signIn(
    loginIdentifier: string,
    _password: string,
  ): Promise<{ user: AuthenticatedUser; tokens: { accessToken: string } }> {
    const source = fakeRepository.signIn(loginIdentifier);
    activeFakeUser = { ...source, permissions: permissionsForProfile(source.profile) };
    return { user: activeFakeUser, tokens: { accessToken: `fake-${source.id}` } };
  }
  async restore(): Promise<AuthenticatedUser> {
    if (!activeFakeUser) throw new Error('Sesión expirada.');
    return activeFakeUser;
  }
  async signOut(): Promise<void> {
    activeFakeUser = undefined;
  }

  async beginCorporateSignIn(): Promise<void> {
    throw new Error('La identidad corporativa no está activa en el modo local.');
  }
}
