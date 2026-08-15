import type { Application, CredentialState, Environment } from '@/domain/model/types';
import type { Page } from '@/domain/model/page';

export interface ApplicationListInput {
  query?: string;
  state?: CredentialState;
  sort?: 'name' | 'institution' | 'lastChangedAt';
  page?: number;
  signal?: AbortSignal;
}

export interface ManagementInput {
  technicalContact?: { name: string; email?: string; phone?: string };
  reason?: string;
  requestOrTicketId?: string;
  expectedUpdatedAt: string;
  signal?: AbortSignal;
}

export interface ApplicationRepository {
  list(environment: Environment, input?: ApplicationListInput): Promise<Page<Application>>;
  get(environment: Environment, applicationId: string, signal?: AbortSignal): Promise<Application>;
  updateManagement(
    environment: Environment,
    applicationId: string,
    input: ManagementInput,
  ): Promise<Application>;
}
