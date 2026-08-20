import { z } from "zod";
import type { UserRepository } from "../../airtable/UserRepository";
import type { AuditSink } from "../../audit/AuditSink";
import { authenticate } from "../../auth/authenticate";
import { authorize } from "../../auth/authorize";
import type { ComplianceAuditPort } from "../../compliance/ComplianceAuditPort";
import { complianceResultSchema } from "../../compliance/eventEnvelope";
import { queryComplianceEvents } from "../../compliance/queryComplianceEvents";
import { verifyComplianceEvent } from "../../compliance/verifyComplianceEvent";
import { ApiError } from "../../http/ApiError";
import { completeOperation } from "../../http/completeOperation";
import type { RequestContext } from "../../http/requestContext";
import { withRequestActor } from "../../http/requestContext";

const querySchema = z
  .object({
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
    applicationId: z.string().min(1).max(200).optional(),
    actorUserId: z.string().min(1).max(200).optional(),
    result: complianceResultSchema.optional(),
    cursor: z.string().min(1).max(500).optional(),
  })
  .strict();

export interface ComplianceAuditRouteDependencies {
  users: UserRepository;
  audit: AuditSink;
  compliance: ComplianceAuditPort;
  signingKey: string;
}

export async function complianceAuditRoute(
  request: Request,
  context: RequestContext,
  dependencies: ComplianceAuditRouteDependencies,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  const integrity = url.pathname.match(
    /^\/v2\/audit-events\/([^/]+)\/integrity$/u,
  );
  if (url.pathname !== "/v2/audit-events" && !integrity) return undefined;
  const user = await authenticate(
    request,
    dependencies.users,
    dependencies.signingKey,
  );
  withRequestActor(context, user);
  authorize(user, "audit:read");
  if (request.method !== "GET") {
    throw new ApiError(
      405,
      "method_not_allowed",
      "El método no está permitido.",
    );
  }
  if (integrity) {
    const eventId = decodeURIComponent(integrity[1]!);
    const completed = await completeOperation({
      audit: dependencies.audit,
      attempt: {
        actor: user,
        operation: "audit.integrity.v2",
        resourceType: "compliance_event",
        resourceId: eventId,
        context,
      },
      execute: () => verifyComplianceEvent(dependencies.compliance, eventId),
    });
    return response(completed.value, context.requestId);
  }
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    throw new ApiError(400, "invalid_query", "La consulta no es válida.");
  }
  const completed = await completeOperation({
    audit: dependencies.audit,
    attempt: {
      actor: user,
      operation: "audit.list.v2",
      resourceType: "audit_collection",
      context,
    },
    execute: () => queryComplianceEvents(dependencies.compliance, parsed.data),
  });
  return response(completed.value, context.requestId);
}

function response(body: unknown, requestId: string): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "cache-control": "no-store",
      "content-type": "application/vnd.keyops.v2+json",
      "x-request-id": requestId,
    },
  });
}
