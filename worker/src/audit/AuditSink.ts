import type { AuthorizedUser } from "../airtable/userSchema";
import type { RequestContext } from "../http/requestContext";
import type { AuditResult } from "./auditEventSchema";

export type { AuditResult } from "./auditEventSchema";

export interface AuditAttempt {
  actor?: AuthorizedUser;
  operation: string;
  resourceType?: string;
  resourceId?: string;
  environment?: "test" | "production";
  institutionId?: string;
  applicationId?: string;
  credentialId?: string;
  result: AuditResult;
  failureCode?: string;
  operationId?: string;
  testRunId?: string;
  context: RequestContext;
}

export interface AuditSink {
  append(attempt: AuditAttempt): Promise<{ auditEventId: string }>;
}

export const noOpAuditSink: AuditSink = {
  async append() {
    return { auditEventId: crypto.randomUUID() };
  },
};
