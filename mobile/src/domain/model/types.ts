export type Environment = 'test' | 'production';
export type UserProfile = 'analyst' | 'senior_analyst' | 'administrator' | 'auditor';
export type CredentialState =
  'no_credentials' | 'active' | 'suspended' | 'rotated_inactive' | 'revoked';
export type AuditOperation =
  | 'sign_in'
  | 'list_applications'
  | 'view_application'
  | 'issue'
  | 'regenerate'
  | 'suspend'
  | 'reactivate'
  | 'revoke'
  | 'delivery'
  | 'update_management'
  | 'list_audit'
  | 'manage_users';

export interface User {
  id: string;
  displayName: string;
  loginIdentifier: string;
  profile: UserProfile;
  enabled: boolean;
}

export interface Application {
  id: string;
  name: string;
  institution: string;
  environment: Environment;
  apiRole: string;
  declaredIps: string[];
  technicalContact?: string;
  requestOrTicketId?: string;
  credentialState: CredentialState;
  clientId?: string;
  lastChangedAt: string;
  credentialHistory?: CredentialHistoryEntry[];
  messagesSent?: number;
  consumedServices?: string[];
  usedIps?: string[];
  lastConsumedAt?: string;
}

export interface CredentialHistoryEntry {
  state: CredentialState;
  changedAt: string;
  actorDisplayName?: string;
}

export interface Delivery {
  deliveryUrl: string;
  otp: string;
  otpExpiresAt: string;
}

export interface Receipt {
  operationId: string;
  requestId: string;
  auditEventId: string;
  result: 'succeeded' | 'failed' | 'rejected';
  delivery?: Delivery;
}

export interface AuditEvent {
  id: string;
  occurredAt: string;
  actorDisplayName: string;
  operation: AuditOperation;
  environment: Environment;
  institution?: string;
  application?: string;
  result: Receipt['result'];
  requestId: string;
}
