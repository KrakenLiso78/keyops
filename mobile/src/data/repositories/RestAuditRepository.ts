import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import { mapAuditPage, mapIntegrityVerification } from '@/data/mappers/auditMapper';
import type { AuditFilters } from '@/domain/model/audit';
import type { AuditRepository } from '@/domain/ports/AuditRepository';

export class RestAuditRepository implements AuditRepository {
  constructor(private readonly http: FetchHttpClient) {}

  async list(filters: AuditFilters = {}, signal?: AbortSignal) {
    const params = new URLSearchParams();
    for (const key of ['from', 'to', 'applicationId', 'actorUserId', 'result', 'cursor'] as const) {
      const value = filters[key];
      if (value) params.set(key, value);
    }
    const query = params.size ? `?${params}` : '';
    return mapAuditPage(
      await this.http.request(`/v2/audit-events${query}`, requestOptions, signal),
    );
  }

  async verify(eventId: string, signal?: AbortSignal) {
    return mapIntegrityVerification(
      await this.http.request(
        `/v2/audit-events/${encodeURIComponent(eventId)}/integrity`,
        requestOptions,
        signal,
      ),
    );
  }
}

const requestOptions = {
  headers: {
    accept: 'application/vnd.keyops.v2+json',
    'x-keyops-contract-version': '2',
  },
};
