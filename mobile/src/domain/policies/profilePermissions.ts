import type { Permission, UserProfile } from '../model/common';

const analystPermissions = [
  'applications:read',
  'credentials:issue',
  'credentials:regenerate',
  'credentials:deliver',
  'credentials:suspend',
  'credentials:reactivate',
  'management:write',
  'usage:read',
] as const satisfies readonly Permission[];

export const permissionsByProfile: Readonly<Record<UserProfile, readonly Permission[]>> = {
  analyst: analystPermissions,
  senior_analyst: [...analystPermissions, 'credentials:revoke', 'audit:read'],
  administrator: [...analystPermissions, 'credentials:revoke', 'audit:read', 'users:write'],
  auditor: ['audit:read'],
};

export const permissionsForProfile = (profile: UserProfile): Permission[] => [
  ...permissionsByProfile[profile],
];
