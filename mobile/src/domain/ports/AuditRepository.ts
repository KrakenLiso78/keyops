import type { AuditEvent, AuditFilters } from '@/domain/model/audit';
import type { Page } from '@/domain/model/page';
export interface AuditRepository {
  list(filters?: AuditFilters, signal?: AbortSignal): Promise<Page<AuditEvent>>;
}
