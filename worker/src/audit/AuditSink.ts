import type { AuthorizedUser } from "../airtable/userSchema";
import type { RequestContext } from "../http/requestContext";

export type AuditResult = "succeeded" | "failed" | "rejected";

export interface AuditAttempt {
  actor?: AuthorizedUser;
  operation: string;
  resourceType?: string;
  resourceId?: string;
  environment?: "test" | "production";
  result: AuditResult;
  failureCode?: string;
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
