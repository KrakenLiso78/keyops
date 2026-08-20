import { complianceAuditPageSchema, integrityVerificationSchema } from '@/data/schemas/audit';

export const mapAuditPage = (input: unknown) => {
  const page = complianceAuditPageSchema.parse(input);
  return {
    items: page.items.map((event) => ({
      id: event.eventId,
      schemaVersion: event.schemaVersion,
      occurredAt: event.occurredAt,
      actorUserId: event.actorUserId,
      operation: event.operation,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      environment: event.environment,
      applicationId: event.applicationId,
      result: event.result,
      originIp: event.originIp,
      requestId: event.requestId,
      integrity: event.integrity,
      retentionUntil: event.retentionUntil,
    })),
    nextCursor: page.nextCursor,
  };
};

export const mapIntegrityVerification = (input: unknown) =>
  integrityVerificationSchema.parse(input);
