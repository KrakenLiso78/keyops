import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import {
  authorizedUserSchema,
  authorizedUsersSchema,
  registerAuthorizedUserSchema,
  updateAuthorizedUserSchema,
} from '@/data/schemas/user';
import type { UserRepository } from '@/domain/ports/UserRepository';

export class RestUserRepository implements UserRepository {
  constructor(private readonly http: FetchHttpClient) {}

  async list() {
    return authorizedUsersSchema.parse(await this.http.request('/v1/users'));
  }

  async create(command: Parameters<UserRepository['create']>[0]) {
    const body = registerAuthorizedUserSchema.parse(command);
    return authorizedUserSchema.parse(
      await this.http.request('/v1/users', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    );
  }

  async update(
    id: string,
    expectedUpdatedAt: string,
    command: Parameters<UserRepository['update']>[2],
  ) {
    const body = updateAuthorizedUserSchema.parse(command);
    return authorizedUserSchema.parse(
      await this.http.request(`/v1/users/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'if-match': `"${expectedUpdatedAt}"` },
        body: JSON.stringify(body),
      }),
    );
  }
}
