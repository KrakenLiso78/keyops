import type { AuthRepository } from '@/domain/ports/AuthRepository';
import type { SecureStoreSessionStore } from '@/data/session/SecureStoreSessionStore';
export async function signIn(
  repository: AuthRepository,
  store: SecureStoreSessionStore,
  loginIdentifier: string,
  password: string,
) {
  const session = await repository.signIn(loginIdentifier, password);
  await store.write(session.tokens);
  return session.user;
}
