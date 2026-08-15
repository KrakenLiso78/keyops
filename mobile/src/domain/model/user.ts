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

export interface AuthorizedUser {
  id: EntityId;
  corporateIssuer: string;
  corporateSubject: string;
  displayName: string;
  profile: UserProfile;
  enabled: boolean;
  permissions: Permission[];
  updatedAt: string;
}

export interface RegisterAuthorizedUserCommand {
  corporateIssuer: string;
  corporateSubject: string;
  profile: UserProfile;
  enabled: boolean;
}

export interface UpdateAuthorizedUserCommand {
  profile: UserProfile;
  enabled: boolean;
}
