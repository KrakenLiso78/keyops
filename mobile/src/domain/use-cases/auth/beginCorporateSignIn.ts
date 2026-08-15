import type { AuthRepository } from '@/domain/ports/AuthRepository';

export async function beginCorporateSignIn(
  repository: AuthRepository,
  returnPath = '/applications',
): Promise<void> {
  if (repository.mode !== 'corporate') {
    throw new Error('La identidad corporativa no está disponible.');
  }
  await repository.beginCorporateSignIn(returnPath);
}
