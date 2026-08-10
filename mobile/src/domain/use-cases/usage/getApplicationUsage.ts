import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { usageSchema } from '@/data/schemas/usage';
import type { Environment } from '@/domain/model/types';

export function getApplicationUsage(environment: Environment, applicationId: string) {
  return usageSchema.parse(fakeRepository.getUsage(applicationId, environment));
}
