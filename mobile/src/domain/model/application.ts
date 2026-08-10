import type { ApiRole, EntityId, Environment, Institution, Instant } from './common';
import type { Credential, CredentialDisplayState, CredentialStateChange } from './credential';
export interface TechnicalContact {
  name: string;
  email?: string;
  phone?: string;
}
export interface ManagementContext {
  technicalContact?: TechnicalContact;
  requestOrTicketId?: string;
  updatedAt?: Instant;
}
export interface IntegratedApplication {
  id: EntityId;
  name: string;
  institution: Institution;
  environment: Environment;
  apiRole: ApiRole;
  declaredIps: string[];
  management: ManagementContext;
  credentialState: CredentialDisplayState;
  credential?: Credential;
  stateHistory: CredentialStateChange[];
  lastChangedAt: Instant;
}
