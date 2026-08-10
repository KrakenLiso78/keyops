import type { EntityId, Environment, Instant } from './common';
export type CredentialState = 'active' | 'suspended' | 'rotated_inactive' | 'revoked';
export type CredentialDisplayState = 'no_credentials' | CredentialState;
export interface CredentialVersion {
  id: EntityId;
  credentialId: EntityId;
  sequence: number;
  previousVersionId?: EntityId;
  state: CredentialState;
  createdAt: Instant;
  stateChangedAt: Instant;
}
export interface Credential {
  id: EntityId;
  applicationId: EntityId;
  environment: Environment;
  clientId: string;
  currentVersion: CredentialVersion;
  versions: CredentialVersion[];
  lastChangedAt: Instant;
}
export interface CredentialStateChange {
  fromState: CredentialDisplayState;
  toState: CredentialState;
  changedAt: Instant;
  reason?: string;
  actorDisplayName?: string;
}
