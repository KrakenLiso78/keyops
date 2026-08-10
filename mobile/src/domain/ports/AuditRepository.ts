import type { AuditEvent } from '@/domain/model/audit';
import type { Page } from '@/domain/model/page';
export interface AuditRepository {
  list(filters?: Record<string, string>): Promise<Page<AuditEvent>>;
}
