import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import { mapSessionResponse, mapSessionView } from '@/data/mappers/sessionMapper';
import type { AuthRepository } from '@/domain/ports/AuthRepository';

export class RestAuthRepository implements AuthRepository {
  constructor(private readonly http: FetchHttpClient) {}

  async signIn(loginIdentifier: string, password: string) {
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

  async restore() {
    return mapSessionView(await this.http.request('/v1/session'));
  }

  async signOut(): Promise<void> {
    // El token de demostración es autocontenido. La limpieza local invalida su uso por la app.
  }
}
