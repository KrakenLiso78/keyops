import type {
  ComplianceAuditPort,
  ComplianceQuery,
} from "./ComplianceAuditPort";
import {
  publicComplianceEventSchema,
  type PublicComplianceEvent,
} from "./eventEnvelope";

export async function queryComplianceEvents(
  port: ComplianceAuditPort,
  query: Omit<ComplianceQuery, "limit">,
): Promise<{ items: PublicComplianceEvent[]; nextCursor?: string }> {
  const page = await port.query({ ...query, limit: 20 });
  const sorted = [...page.items].sort(
    (left, right) =>
      left.occurredAt.localeCompare(right.occurredAt) ||
      left.eventId.localeCompare(right.eventId),
  );
  return {
    items: sorted.map((event) => publicComplianceEventSchema.parse(event)),
    nextCursor: page.nextCursor,
  };
}
