import { fakeRepository } from './FakeKeyOpsRepository';
import type { AuditEvent, AuditFilters } from '@/domain/model/audit';
import type { AuditRepository } from '@/domain/ports/AuditRepository';

export const fakeAuditRepository: AuditRepository = {
  async list(filters: AuditFilters = {}) {
    const items: AuditEvent[] = fakeRepository
      .listAudit()
      .map((event) => ({
        id: event.id,
        schemaVersion: 2,
        occurredAt: event.occurredAt,
        actorUserId: event.actorDisplayName === 'Ana Torres' ? 'u-1' : 'demo-user',
        actorDisplayName: event.actorDisplayName,
        operation: `${event.operation}.v1`,
        resourceType: event.application ? 'application' : 'session',
        resourceId: event.application,
        environment: event.environment,
        institutionId: event.institution,
        applicationId: event.application,
        result: event.result,
        originIp: '127.0.0.1',
        requestId: event.requestId,
        integrity: 'unavailable' as const,
        retentionUntil: retentionUntil(event.occurredAt),
      }))
      .filter((event) => !filters.from || event.occurredAt >= filters.from)
      .filter((event) => !filters.to || event.occurredAt <= filters.to)
      .filter((event) => !filters.applicationId || event.applicationId === filters.applicationId)
      .filter((event) => !filters.actorUserId || event.actorUserId === filters.actorUserId)
      .filter((event) => !filters.result || event.result === filters.result)
      .sort(
        (left, right) =>
          right.occurredAt.localeCompare(left.occurredAt) || right.id.localeCompare(left.id),
      );
    const offset = filters.cursor ? Number(filters.cursor.replace(/^cursor:/u, '')) : 0;
    const pageSize = 20;
    const page = items.slice(offset, offset + pageSize);
    return {
      items: page,
      nextCursor:
        offset + page.length < items.length ? `cursor:${offset + page.length}` : undefined,
    };
  },
  async verify(eventId: string) {
    const event = (await this.list()).items.find(({ id }) => id === eventId);
    if (!event) throw new Error('No se encontró el evento de auditoría.');
    return {
      eventId,
      status: 'unavailable',
      verifiedAt: new Date().toISOString(),
      retentionUntil: event.retentionUntil,
    };
  },
};

function retentionUntil(occurredAt: string): string {
  const value = new Date(occurredAt);
  value.setUTCFullYear(value.getUTCFullYear() + 5);
  return value.toISOString();
}
