import type { AuthRepository } from '@/domain/ports/AuthRepository';
import type { SessionStore } from '@/domain/ports/SessionStore';
export async function signOut(repository: AuthRepository, store: SessionStore) {
  try {
    await repository.signOut();
  } finally {
    await store.clear();
  }
}
