import { FakeAuthRepository } from '@/data/fake/FakeAuthRepository';
describe('sesión fake', () => {
  it('inicia, restaura y cierra sesión', async () => {
    const repository = new FakeAuthRepository();
    const session = await repository.signIn('analista', 'demo');
    expect(session.user.profile).toBe('analyst');
    await expect(repository.restore()).resolves.toMatchObject({ loginIdentifier: 'analista' });
    await repository.signOut();
    await expect(repository.restore()).rejects.toThrow('Sesión expirada');
  });
});
