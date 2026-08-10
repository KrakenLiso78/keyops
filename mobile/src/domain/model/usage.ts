import type { EntityId, Environment, Instant } from './common';
export interface UsageSummary {
  applicationId: EntityId;
  environment: Environment;
  availability: 'available' | 'no_data' | 'unavailable';
  messagesSent?: number;
  consumedServices: string[];
  usedIps: string[];
  lastConsumedAt?: Instant;
}
