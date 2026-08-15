import type {
  AuthorizedUser,
  RegisterAuthorizedUserCommand,
  UpdateAuthorizedUserCommand,
} from '@/domain/model/user';
export interface UserRepository {
  list(): Promise<AuthorizedUser[]>;
  create(command: RegisterAuthorizedUserCommand): Promise<AuthorizedUser>;
  update(
    id: string,
    expectedUpdatedAt: string,
    command: UpdateAuthorizedUserCommand,
  ): Promise<AuthorizedUser>;
}
