import type { EntityId, Permission, UserProfile } from './common';
export interface AuthenticatedUser {
  id: EntityId;
  loginIdentifier: string;
  displayName: string;
  profile: UserProfile;
  enabled: boolean;
  permissions: Permission[];
}
export interface SessionTokens {
  accessToken: string;
  refreshToken?: string;
}
