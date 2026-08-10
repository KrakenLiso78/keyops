import { FakeCredentialRepository } from '@/data/fake/FakeCredentialRepository';
import type { Environment, User } from '@/domain/model/types';
export type CredentialOperation =
  'issue' | 'regenerate' | 'delivery' | 'suspend' | 'reactivate' | 'revoke';
export function operateCredential(
  user: User,
  environment: Environment,
  applicationId: string,
  operation: CredentialOperation,
  reason?: string,
) {
  const repository = new FakeCredentialRepository(user);
  if (operation === 'issue') return repository.issue(environment, applicationId);
  if (operation === 'regenerate') return repository.regenerate(environment, applicationId);
  if (operation === 'delivery') return repository.deliver(environment, applicationId);
  if (operation === 'suspend') return repository.suspend(environment, applicationId, reason ?? '');
  if (operation === 'reactivate')
    return repository.reactivate(environment, applicationId, reason ?? '');
  return repository.revoke(environment, applicationId, reason ?? '');
}
