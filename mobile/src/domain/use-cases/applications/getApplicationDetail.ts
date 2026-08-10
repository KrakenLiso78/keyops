import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import type { Environment } from '@/domain/model/types';
export function getApplicationDetail(environment: Environment, applicationId: string) {
  const application = fakeRepository.getApplication(applicationId, environment);
  if (!application) throw new Error('Aplicación no encontrada.');
  return application;
}
