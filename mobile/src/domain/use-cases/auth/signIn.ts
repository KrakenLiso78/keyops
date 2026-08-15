import type { AuthRepository } from '@/domain/ports/AuthRepository';
import type { SessionStore } from '@/domain/ports/SessionStore';
export async function signIn(
  repository: AuthRepository,
  store: SessionStore,
  loginIdentifier: string,
  password: string,
) {
  const session = await repository.signIn(loginIdentifier, password);
  await store.write(session.tokens);
  return session.user;
}
