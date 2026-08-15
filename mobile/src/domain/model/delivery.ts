import type { EntityId, Instant } from './common';
export interface ProtectedDelivery {
  deliveryId: EntityId;
  credentialVersionId: EntityId;
  deliveryUrl: string;
  otp: string;
  otpExpiresAt: Instant;
  createdAt: Instant;
}

export interface SyntheticArtifact {
  classification: 'SYNTHETIC-NON-FUNCTIONAL';
  applicationId: EntityId;
  credentialVersionId: EntityId;
  generatedAt: Instant;
}
