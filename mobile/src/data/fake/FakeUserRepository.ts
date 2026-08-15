import { fakeRepository } from './FakeKeyOpsRepository';
import type {
  AuthorizedUser,
  RegisterAuthorizedUserCommand,
  UpdateAuthorizedUserCommand,
} from '@/domain/model/user';
import type { UserRepository } from '@/domain/ports/UserRepository';
import { permissionsForProfile } from '@/domain/policies/profilePermissions';

const versions = new Map<string, string>();

function map(user: ReturnType<typeof fakeRepository.listUsers>[number]): AuthorizedUser {
  const updatedAt = versions.get(user.id) ?? '2026-08-15T10:00:00.000Z';
  versions.set(user.id, updatedAt);
  return {
    id: user.id,
    corporateIssuer: 'https://identity.fake.invalid',
    corporateSubject: user.loginIdentifier,
    displayName: user.displayName,
    profile: user.profile,
    enabled: user.enabled,
    permissions: permissionsForProfile(user.profile),
    updatedAt,
  };
}

export class FakeUserRepository implements UserRepository {
  async list() {
    return fakeRepository.listUsers().map(map);
  }

  async create(command: RegisterAuthorizedUserCommand) {
    const created = fakeRepository.createUser({
      displayName: 'Identidad pendiente de validación',
      loginIdentifier: command.corporateSubject,
      profile: command.profile,
      enabled: command.enabled,
    });
    return map(created);
  }

  async update(id: string, _expectedUpdatedAt: string, command: UpdateAuthorizedUserCommand) {
    versions.set(id, new Date().toISOString());
    return map(fakeRepository.updateUser(id, command.profile, command.enabled));
  }
}
