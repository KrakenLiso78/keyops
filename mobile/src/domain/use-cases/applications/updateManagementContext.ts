import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import {
  managementContextPatchSchema,
  type ManagementContextPatch,
} from '@/data/schemas/managementContext';
import type { Environment } from '@/domain/model/types';

export function updateManagementContext(
  environment: Environment,
  applicationId: string,
  input: ManagementContextPatch,
) {
  const patch = managementContextPatchSchema.parse(input);
  return fakeRepository.updateManagement(
    applicationId,
    environment,
    patch.technicalContact,
    patch.requestOrTicketId,
  );
}
