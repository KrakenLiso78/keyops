import { fakeRepository } from './FakeKeyOpsRepository';
import type { AuthRepository } from '@/domain/ports/AuthRepository';
import type { AuthenticatedUser } from '@/domain/model/user';
import { permissionsForProfile } from '@/domain/policies/profilePermissions';
export class FakeAuthRepository implements AuthRepository {
  private user?: AuthenticatedUser;
  async signIn(
    loginIdentifier: string,
    _password: string,
  ): Promise<{ user: AuthenticatedUser; tokens: { accessToken: string } }> {
    const source = fakeRepository.signIn(loginIdentifier);
    this.user = { ...source, permissions: permissionsForProfile(source.profile) };
    return { user: this.user, tokens: { accessToken: `fake-${source.id}` } };
  }
  async restore(): Promise<AuthenticatedUser> {
    if (!this.user) throw new Error('Sesión expirada.');
    return this.user;
  }
  async signOut(): Promise<void> {
    this.user = undefined;
  }
}
