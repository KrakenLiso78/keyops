import type { Environment } from '@/domain/model/common';
import type { UsageSummary } from '@/domain/model/usage';
export interface UsageRepository {
  get(environment: Environment, applicationId: string): Promise<UsageSummary>;
}
