import type { AuthRepository } from '@/domain/ports/AuthRepository';
import type { SessionStore } from '@/domain/ports/SessionStore';
export async function restoreSession(repository: AuthRepository, store: SessionStore) {
  if (repository.mode === 'credentials' && !(await store.read())) return undefined;
  try {
    return await repository.restore();
  } catch (error) {
    await store.clear();
    throw error;
  }
}
