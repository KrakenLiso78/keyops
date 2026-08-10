import { FetchHttpClient } from '@/data/http/FetchHttpClient';
import { redact } from '@/data/http/redact';
describe('FetchHttpClient', () => {
  afterEach(() => jest.restoreAllMocks());
  it('normaliza un 401 sin filtrar secretos', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          contractVersion: '1',
          code: 'expired',
          message: 'Sesión expirada',
          requestId: 'req-1',
        }),
        { status: 401 },
      ) as Response,
    );
    const client = new FetchHttpClient('https://api.local', async () => 'token');
    await expect(client.request('/v1/session')).rejects.toMatchObject({
      status: 401,
      code: 'expired',
    });
  });
  it('redacta campos sensibles', () =>
    expect(redact({ authorization: 'x', otp: '1', safe: 'ok' })).toEqual({
      authorization: '[REDACTED]',
      otp: '[REDACTED]',
      safe: 'ok',
    }));
});
