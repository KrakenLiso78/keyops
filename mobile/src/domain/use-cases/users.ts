import type {
  AuthenticatedUser,
  RegisterAuthorizedUserCommand,
  UpdateAuthorizedUserCommand,
} from '@/domain/model/user';
import type { UserRepository } from '@/domain/ports/UserRepository';

function requireAdministrator(actor: AuthenticatedUser) {
  if (!actor.enabled || !actor.permissions.includes('users:write')) {
    throw new Error('No tienes permiso para gestionar usuarios.');
  }
}

export async function listCorporateUsers(actor: AuthenticatedUser, repository: UserRepository) {
  requireAdministrator(actor);
  return repository.list();
}

export async function registerCorporateUser(
  actor: AuthenticatedUser,
  repository: UserRepository,
  command: RegisterAuthorizedUserCommand,
) {
  requireAdministrator(actor);
  return repository.create(command);
}

export async function updateCorporateUser(
  actor: AuthenticatedUser,
  repository: UserRepository,
  userId: string,
  expectedUpdatedAt: string,
  command: UpdateAuthorizedUserCommand,
) {
  requireAdministrator(actor);
  return repository.update(userId, expectedUpdatedAt, command);
}
