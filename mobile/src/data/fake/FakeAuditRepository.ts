import { fakeRepository } from './FakeKeyOpsRepository';
import type { AuditEvent, AuditFilters } from '@/domain/model/audit';
import type { AuditRepository } from '@/domain/ports/AuditRepository';

export const fakeAuditRepository: AuditRepository = {
  async list(filters: AuditFilters = {}) {
    const items: AuditEvent[] = fakeRepository
      .listAudit()
      .map((event) => ({
        id: event.id,
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
      }))
      .filter((event) => !filters.from || event.occurredAt >= filters.from)
      .filter((event) => !filters.to || event.occurredAt <= filters.to)
      .filter((event) => !filters.institutionId || event.institutionId === filters.institutionId)
      .filter((event) => !filters.applicationId || event.applicationId === filters.applicationId)
      .filter((event) => !filters.actorUserId || event.actorUserId === filters.actorUserId)
      .filter((event) => !filters.result || event.result === filters.result)
      .sort(
        (left, right) =>
          right.occurredAt.localeCompare(left.occurredAt) || right.id.localeCompare(left.id),
      );
    const page = filters.page ?? 1;
    const pageSize = 20;
    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: items.length,
    };
  },
};
