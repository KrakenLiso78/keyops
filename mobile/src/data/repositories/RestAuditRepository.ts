import type { FetchHttpClient } from '@/data/http/FetchHttpClient';
import { mapAuditPage, mapIntegrityVerification } from '@/data/mappers/auditMapper';
import type { AuditFilters } from '@/domain/model/audit';
import type { AuditRepository } from '@/domain/ports/AuditRepository';
import { z } from 'zod';

const syntheticAuditPageSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      occurredAt: z.string(),
      actorUserId: z.string(),
      operation: z.string(),
      resourceType: z.string(),
      resourceId: z.string().optional(),
      environment: z.enum(['test', 'production']).optional(),
      applicationId: z.string().optional(),
      result: z.enum(['succeeded', 'failed', 'rejected']),
      originIp: z.string(),
      requestId: z.string(),
    }),
  ),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export class RestAuditRepository implements AuditRepository {
  constructor(
    private readonly http: FetchHttpClient,
    private readonly getWorkerMode: () => Promise<'fake' | 'real'> = async () => 'real',
  ) {}

  async list(filters: AuditFilters = {}, signal?: AbortSignal) {
    if ((await this.getWorkerMode()) === 'fake') {
      const params = new URLSearchParams();
      for (const key of ['from', 'to', 'applicationId', 'actorUserId', 'result'] as const) {
        const value = filters[key];
        if (value) params.set(key, value);
      }
      const query = params.size ? `?${params}` : '';
      const page = syntheticAuditPageSchema.parse(
        await this.http.request(`/v1/audit-events${query}`, undefined, signal),
      );
      return {
        items: page.items.map((event) => ({
          ...event,
          schemaVersion: 1,
          integrity: 'unavailable' as const,
          retentionUntil: event.occurredAt,
        })),
        nextCursor: undefined,
      };
    }
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
    if ((await this.getWorkerMode()) === 'fake') {
      void signal;
      const now = new Date().toISOString();
      return {
        eventId,
        status: 'unavailable' as const,
        verifiedAt: now,
        retentionUntil: now,
      };
    }
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
