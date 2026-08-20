import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import { mapSessionResponse, mapSessionView } from '@/data/mappers/sessionMapper';
import type { AuthRepository } from '@/domain/ports/AuthRepository';
import type { AuthenticatedUser, SessionTokens } from '@/domain/model/user';

export class RestAuthRepository implements AuthRepository {
  readonly mode: 'credentials' | 'corporate';

  constructor(
    private readonly http: FetchHttpClient,
    private readonly navigate: (url: string) => void | Promise<void> = (url) => {
      if (typeof window !== 'undefined') window.location.assign(url);
    },
    mode: 'credentials' | 'corporate' = 'corporate',
  ) {
    this.mode = mode;
  }

  async signIn(
    loginIdentifier: string,
    password: string,
  ): Promise<{ user: AuthenticatedUser; tokens: SessionTokens }> {
    if (this.mode === 'corporate') {
      throw new Error('El acceso remoto requiere identidad corporativa.');
    }
    const session = mapSessionResponse(
      await this.http.request('/v1/sessions', {
        method: 'POST',
        body: JSON.stringify({ loginIdentifier, password }),
      }),
    );
    return {
      user: session.user,
      tokens: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      },
    };
  }

  async beginCorporateSignIn(returnPath = '/applications'): Promise<void> {
    if (this.mode !== 'corporate') {
      throw new Error('La identidad corporativa no está configurada.');
    }
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
