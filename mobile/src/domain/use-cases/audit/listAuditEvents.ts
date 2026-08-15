import type { AuditFilters } from '@/domain/model/audit';
import type { AuthenticatedUser } from '@/domain/model/user';
import type { AuditRepository } from '@/domain/ports/AuditRepository';

export const canListAuditEvents = (user: AuthenticatedUser) =>
  user.enabled && user.permissions.includes('audit:read');

export async function listAuditEvents(
  repository: AuditRepository,
  user: AuthenticatedUser,
  filters: AuditFilters = {},
  signal?: AbortSignal,
) {
  if (!canListAuditEvents(user)) {
    throw new Error('No tienes permiso para consultar la auditoría.');
  }
  return repository.list(filters, signal);
}
