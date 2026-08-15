import { RestAuthRepository } from '@/data/repositories/RestAuthRepository';

describe('RestAuthRepository', () => {
  it('envía credenciales solo al endpoint de sesión y valida la respuesta', async () => {
    const request = jest.fn(async () => ({
      contractVersion: '1',
      accessToken: 'signed-token',
      expiresAt: '2026-08-15T20:00:00.000Z',
      user: {
        id: 'user-analyst',
        loginIdentifier: 'analyst@example.invalid',
        displayName: 'Analista Demo',
        profile: 'analyst',
        enabled: true,
        permissions: ['applications:read'],
      },
    }));
    const repository = new RestAuthRepository({ request } as never);
    await expect(repository.signIn('analyst@example.invalid', 'secret')).resolves.toMatchObject({
      user: { id: 'user-analyst' },
      tokens: { accessToken: 'signed-token' },
    });
    expect(request).toHaveBeenCalledWith('/v1/sessions', {
      method: 'POST',
      body: JSON.stringify({
        loginIdentifier: 'analyst@example.invalid',
        password: 'secret',
      }),
    });
  });
});
