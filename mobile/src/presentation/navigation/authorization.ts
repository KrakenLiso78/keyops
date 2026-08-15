import type { Permission } from '@/domain/model/common';
import type { AuthenticatedUser } from '@/domain/model/user';

export type ProtectedPath = '/applications' | '/audit' | '/users';

export function requiredPermissionForPath(pathname: string): Permission {
  if (pathname.startsWith('/audit')) return 'audit:read';
  if (pathname.startsWith('/users')) return 'users:write';
  return 'applications:read';
}

export function firstAllowedPath(user: AuthenticatedUser): ProtectedPath | undefined {
  if (user.permissions.includes('applications:read')) return '/applications';
  if (user.permissions.includes('audit:read')) return '/audit';
  if (user.permissions.includes('users:write')) return '/users';
  return undefined;
}
