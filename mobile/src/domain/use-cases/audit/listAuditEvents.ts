import { fakeRepository } from '@/data/fake/FakeKeyOpsRepository';
import type { AuditEvent, User } from '@/domain/model/types';
import { canReadAudit } from '@/domain/policies/permittedActions';

export type AuditFilters = {
  query?: string;
  environment?: AuditEvent['environment'];
  page?: number;
  pageSize?: number;
};

export function listAuditEvents(user: User, filters: AuditFilters = {}) {
  if (!canReadAudit(user.profile))
    throw new Error('No tienes permiso para consultar la auditoría.');
  const query = filters.query?.trim().toLowerCase();
  const matching = fakeRepository
    .listAudit()
    .filter((event) => !filters.environment || event.environment === filters.environment)
    .filter(
      (event) =>
        !query ||
        `${event.actorDisplayName} ${event.application ?? ''} ${event.institution ?? ''}`
          .toLowerCase()
          .includes(query),
    )
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  return {
    items: matching.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: matching.length,
  };
}
