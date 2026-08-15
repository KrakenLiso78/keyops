import { RestAuthRepository } from '@/data/repositories/RestAuthRepository';

describe('RestAuthRepository', () => {
  it('inicia el redirect corporativo sin enviar credenciales', async () => {
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
    const resolve = jest.fn((path: string) => `https://keyops.example${path}`);
    const navigate = jest.fn();
    const repository = new RestAuthRepository({ request, resolve } as never, navigate);
    await repository.beginCorporateSignIn('/audit');
    expect(navigate).toHaveBeenCalledWith(
      'https://keyops.example/v1/auth/login?returnPath=%2Faudit',
    );
    expect(request).not.toHaveBeenCalled();
    await expect(repository.signIn('analyst@example.invalid', 'secret')).rejects.toThrow(
      'identidad corporativa',
    );
  });
});
