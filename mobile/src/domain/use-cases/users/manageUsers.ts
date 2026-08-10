import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import { userCommandSchema } from '@/data/schemas/user';
import type { User, UserProfile } from '@/domain/model/types';
import { canManageUsers } from '@/domain/policies/permittedActions';

function requireAdministrator(actor: User) {
  if (!canManageUsers(actor.profile)) throw new Error('No tienes permiso para gestionar usuarios.');
}

export function listAuthorizedUsers(actor: User) {
  requireAdministrator(actor);
  return fakeRepository.listUsers();
}

export function createAuthorizedUser(actor: User, input: Omit<User, 'id'>) {
  requireAdministrator(actor);
  return fakeRepository.createUser(userCommandSchema.parse(input));
}

export function updateAuthorizedUser(
  actor: User,
  userId: string,
  profile: UserProfile,
  enabled: boolean,
) {
  requireAdministrator(actor);
  return fakeRepository.updateUser(userId, profile, enabled);
}
