import type { AuditEventStore } from "../airtable/AuditEventRepository";
import type { AuthorizedUser } from "../airtable/userSchema";
import { authorize } from "../auth/authorize";
import {
  auditResultSchema,
  publicAuditEvent,
  type AuditResult,
} from "./auditEventSchema";

export interface AuditQuery {
  from?: string;
  to?: string;
  institutionId?: string;
  applicationId?: string;
  actorUserId?: string;
  result?: AuditResult;
  page: number;
}

const pageSize = 20;

export async function listAuditEvents(
  user: AuthorizedUser,
  repository: AuditEventStore,
  query: AuditQuery,
) {
  authorize(user, "audit:read");
  const matching = (await repository.list())
    .map(({ fields }) => fields)
    .filter((event) => !query.from || event.occurredAt >= query.from)
    .filter((event) => !query.to || event.occurredAt <= query.to)
    .filter(
      (event) =>
        !query.institutionId || event.institutionId === query.institutionId,
    )
    .filter(
      (event) =>
        !query.applicationId || event.applicationId === query.applicationId,
    )
    .filter(
      (event) => !query.actorUserId || event.actorUserId === query.actorUserId,
    )
    .filter(
      (event) =>
        !query.result ||
        (auditResultSchema.safeParse(event.result).success &&
          event.result === query.result),
    )
    .toSorted(
      (left, right) =>
        right.occurredAt.localeCompare(left.occurredAt) ||
        right.eventId.localeCompare(left.eventId),
    );
  const offset = (query.page - 1) * pageSize;
  return {
    items: matching.slice(offset, offset + pageSize).map(publicAuditEvent),
    page: query.page,
    pageSize,
    total: matching.length,
  };
}
