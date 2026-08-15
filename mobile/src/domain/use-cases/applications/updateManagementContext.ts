import { z } from 'zod';
import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import type { Environment } from '@/domain/model/types';
import type { ApplicationRepository, ManagementInput } from '@/domain/ports/ApplicationRepository';

const legacyManagementPatchSchema = z.object({
  technicalContact: z.string().trim().min(2).max(120).optional(),
  requestOrTicketId: z.string().trim().min(2).max(80).optional(),
});

export function updateManagementContext(
  environment: Environment,
  applicationId: string,
  input: z.infer<typeof legacyManagementPatchSchema>,
) {
  const patch = legacyManagementPatchSchema.parse(input);
  return fakeRepository.updateManagement(
    applicationId,
    environment,
    patch.technicalContact,
    patch.requestOrTicketId,
  );
}

export function updatePersistentManagementContext(
  repository: ApplicationRepository,
  environment: Environment,
  applicationId: string,
  input: ManagementInput,
) {
  return repository.updateManagement(environment, applicationId, input);
}
