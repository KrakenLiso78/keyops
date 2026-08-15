import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import { mapSessionView } from '@/data/mappers/sessionMapper';
import type { AuthRepository } from '@/domain/ports/AuthRepository';
import type { AuthenticatedUser, SessionTokens } from '@/domain/model/user';

export class RestAuthRepository implements AuthRepository {
  readonly mode = 'corporate' as const;

  constructor(
    private readonly http: FetchHttpClient,
    private readonly navigate: (url: string) => void | Promise<void> = (url) => {
      if (typeof window !== 'undefined') window.location.assign(url);
    },
  ) {}

  async signIn(
    loginIdentifier: string,
    password: string,
  ): Promise<{ user: AuthenticatedUser; tokens: SessionTokens }> {
    void loginIdentifier;
    void password;
    throw new Error('El acceso remoto requiere identidad corporativa.');
  }

  async beginCorporateSignIn(returnPath = '/applications'): Promise<void> {
    const query = new URLSearchParams({ returnPath }).toString();
    await this.navigate(this.http.resolve(`/v1/auth/login?${query}`));
  }

  async restore() {
    return mapSessionView(await this.http.request('/v1/session'));
  }

  async signOut(): Promise<void> {
    await this.http.request('/v1/auth/logout', { method: 'POST' });
  }
}
