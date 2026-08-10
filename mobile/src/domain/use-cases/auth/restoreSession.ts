import type { AuthRepository } from '@/domain/ports/AuthRepository';
import type { SecureStoreSessionStore } from '@/data/session/SecureStoreSessionStore';
export async function restoreSession(repository: AuthRepository, store: SecureStoreSessionStore) {
  if (!(await store.read())) return undefined;
  try {
    return await repository.restore();
  } catch (error) {
    await store.clear();
    throw error;
  }
}
