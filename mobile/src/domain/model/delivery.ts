import type { EntityId, Instant } from './common';
export interface ProtectedDelivery {
  deliveryId: EntityId;
  credentialVersionId: EntityId;
  deliveryUrl: string;
  otp: string;
  otpExpiresAt: Instant;
  createdAt: Instant;
}
