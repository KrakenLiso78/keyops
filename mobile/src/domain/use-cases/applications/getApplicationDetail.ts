import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import type { Environment } from '@/domain/model/types';
import type { ApplicationRepository } from '@/domain/ports/ApplicationRepository';
export function getApplicationDetail(environment: Environment, applicationId: string) {
  const application = fakeRepository.getApplication(applicationId, environment);
  if (!application) throw new Error('Aplicación no encontrada.');
  return application;
}

export function getPersistentApplicationDetail(
  repository: ApplicationRepository,
  environment: Environment,
  applicationId: string,
  signal?: AbortSignal,
) {
  return repository.get(environment, applicationId, signal);
}
