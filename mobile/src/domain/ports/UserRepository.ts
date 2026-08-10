import type { AuthenticatedUser } from '@/domain/model/user';
import type { Page } from '@/domain/model/page';
export interface UserRepository {
  list(): Promise<Page<AuthenticatedUser>>;
  create(user: Omit<AuthenticatedUser, 'id'>): Promise<AuthenticatedUser>;
  update(id: string, patch: Partial<AuthenticatedUser>): Promise<AuthenticatedUser>;
}
