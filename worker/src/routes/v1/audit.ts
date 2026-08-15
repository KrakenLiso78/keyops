import { z } from "zod";
import type { UserRepository } from "../../airtable/UserRepository";
import type { AuditEventStore } from "../../airtable/AuditEventRepository";
import { auditResultSchema } from "../../audit/auditEventSchema";
import type { AuditSink } from "../../audit/AuditSink";
import { listAuditEvents } from "../../audit/listAuditEvents";
import { authenticate } from "../../auth/authenticate";
import { ApiError } from "../../http/ApiError";
import { completeOperation } from "../../http/completeOperation";
import {
  type RequestContext,
  withRequestActor,
} from "../../http/requestContext";

const identifier = z.string().min(1).max(200);
const querySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  institutionId: identifier.optional(),
  applicationId: identifier.optional(),
  actorUserId: identifier.optional(),
  result: auditResultSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export interface AuditRouteDependencies {
  users: UserRepository;
  events: AuditEventStore;
  audit: AuditSink;
  signingKey: string;
}

export async function auditRoute(
  request: Request,
  context: RequestContext,
  dependencies: AuditRouteDependencies,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (url.pathname !== "/v1/audit-events") return undefined;
  const user = await authenticate(
    request,
    dependencies.users,
    dependencies.signingKey,
  );
  withRequestActor(context, user);
  const completed = await completeOperation({
    audit: dependencies.audit,
    attempt: {
      actor: user,
      operation: "audit.list.v1",
      resourceType: "audit_collection",
      context,
    },
    execute: async () => {
      if (request.method !== "GET") {
        throw new ApiError(
          405,
          "method_not_allowed",
          "El método no está permitido.",
        );
      }
      const parsed = querySchema.safeParse(
        Object.fromEntries(url.searchParams),
      );
      if (!parsed.success) {
        throw new ApiError(400, "invalid_query", "La consulta no es válida.");
      }
      return listAuditEvents(user, dependencies.events, parsed.data);
    },
  });
  return Response.json(
    { contractVersion: "1", ...completed.value },
    { headers: { "x-request-id": context.requestId } },
  );
}
