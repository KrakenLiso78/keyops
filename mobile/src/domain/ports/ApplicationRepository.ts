import type { IntegratedApplication } from '@/domain/model/application';
import type { Environment } from '@/domain/model/common';
import type { Page } from '@/domain/model/page';
export interface ApplicationRepository {
  list(environment: Environment, query?: string): Promise<Page<IntegratedApplication>>;
  get(environment: Environment, applicationId: string): Promise<IntegratedApplication>;
  updateManagement(
    environment: Environment,
    applicationId: string,
    input: { technicalContact?: string; requestOrTicketId?: string },
  ): Promise<IntegratedApplication>;
}
