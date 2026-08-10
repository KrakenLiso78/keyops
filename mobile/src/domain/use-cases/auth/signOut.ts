import type { AuthRepository } from '@/domain/ports/AuthRepository';
import type { SecureStoreSessionStore } from '@/data/session/SecureStoreSessionStore';
export async function signOut(repository: AuthRepository, store: SecureStoreSessionStore) {
  try {
    await repository.signOut();
  } finally {
    await store.clear();
  }
}
