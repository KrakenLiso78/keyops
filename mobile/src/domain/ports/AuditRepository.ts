import type { AuditFilters, AuditPage, IntegrityVerification } from '@/domain/model/audit';
export interface AuditRepository {
  list(filters?: AuditFilters, signal?: AbortSignal): Promise<AuditPage>;
  verify(eventId: string, signal?: AbortSignal): Promise<IntegrityVerification>;
}
