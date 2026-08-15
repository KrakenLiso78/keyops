import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import { mapAuditPage } from '@/data/mappers/auditMapper';
import type { AuditFilters } from '@/domain/model/audit';
import type { AuditRepository } from '@/domain/ports/AuditRepository';

export class RestAuditRepository implements AuditRepository {
  constructor(private readonly http: FetchHttpClient) {}

  async list(filters: AuditFilters = {}, signal?: AbortSignal) {
    const params = new URLSearchParams({ page: String(filters.page ?? 1) });
    for (const key of [
      'from',
      'to',
      'institutionId',
      'applicationId',
      'actorUserId',
      'result',
    ] as const) {
      const value = filters[key];
      if (value) params.set(key, value);
    }
    return mapAuditPage(await this.http.request(`/v1/audit-events?${params}`, {}, signal));
  }
}
