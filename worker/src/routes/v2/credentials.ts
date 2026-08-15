import type { UserRepository } from "../../airtable/UserRepository";
import type { AuditSink } from "../../audit/AuditSink";
import { authenticate } from "../../auth/authenticate";
import { authorize } from "../../auth/authorize";
import { environmentSchema } from "../../airtable/applicationSchema";
import type { RealOperationDependencies } from "../../credentials/real/realOperationService";
import { RealOperationService } from "../../credentials/real/realOperationService";
import { ApiError } from "../../http/ApiError";
import type { RequestContext } from "../../http/requestContext";
import { withRequestActor } from "../../http/requestContext";
import { z } from "zod";

export interface RealCredentialRouteDependencies {
  users: UserRepository;
  audit: AuditSink;
  signingKey: string;
  real?: Omit<RealOperationDependencies, "audit">;
}

const transitionBodySchema = z
  .object({
    action: z.enum(["suspend", "reactivate", "revoke"]),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

function environmentFrom(url: URL): "test" | "production" {
  const parsed = environmentSchema.safeParse(
    url.searchParams.get("environment"),
  );
  if (!parsed.success) {
    throw new ApiError(400, "invalid_environment", "El ambiente no es válido.");
  }
  return parsed.data;
}

function requireV2(request: Request): void {
  const requested = request.headers.get("x-keyops-contract-version");
  if (requested && requested !== "2") {
    throw new ApiError(
      406,
      "unsupported_contract_version",
      "La versión de contrato solicitada no está soportada.",
    );
  }
}

function requireReal(
  dependencies: RealCredentialRouteDependencies,
): RealOperationDependencies {
  if (!dependencies.real) {
    throw new ApiError(
      503,
      "real_credentials_not_configured",
      "Las operaciones de credenciales reales no están configuradas.",
    );
  }
  return { ...dependencies.real, audit: dependencies.audit };
}

const responseHeaders = (requestId: string) => ({
  "cache-control": "no-store",
  "content-type": "application/vnd.keyops.v2+json",
  "x-request-id": requestId,
});

export async function realCredentialsRoute(
  request: Request,
  context: RequestContext,
  dependencies: RealCredentialRouteDependencies,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  const issue = url.pathname.match(
    /^\/v2\/applications\/([^/]+)\/credentials$/u,
  );
  const rotation = url.pathname.match(
    /^\/v2\/applications\/([^/]+)\/credentials\/([^/]+)\/regenerations$/u,
  );
  const transition = url.pathname.match(
    /^\/v2\/applications\/([^/]+)\/credentials\/([^/]+)\/transitions$/u,
  );
  const status = url.pathname.match(/^\/v2\/operations\/([^/]+)$/u);
  if (!issue && !rotation && !transition && !status) return undefined;

  requireV2(request);
  const user = await authenticate(
    request,
    dependencies.users,
    dependencies.signingKey,
  );
  withRequestActor(context, user);
  const service = new RealOperationService(requireReal(dependencies));

  if (status) {
    if (request.method !== "GET") throw methodNotAllowed();
    authorize(user, "applications:read");
    const receipt = await service.status({
      user,
      operationId: decodeURIComponent(status[1]!),
      context,
    });
    return new Response(JSON.stringify({ contractVersion: "2", ...receipt }), {
      headers: responseHeaders(receipt.requestId),
    });
  }
  if (request.method !== "POST") throw methodNotAllowed();

  const matched = issue ?? rotation ?? transition!;
  const applicationId = decodeURIComponent(matched[1]!);
  const credentialId = issue ? undefined : decodeURIComponent(matched[2]!);
  const environment = environmentFrom(url);
  const transitionBody = transition
    ? transitionBodySchema.safeParse(
        await request.json().catch(() => undefined),
      )
    : undefined;
  if (transitionBody && !transitionBody.success) {
    throw new ApiError(
      400,
      "invalid_transition",
      "La transición o el motivo no son válidos.",
    );
  }
  const action = issue
    ? ("issue" as const)
    : rotation
      ? ("rotate" as const)
      : transitionBody!.data.action;
  authorize(
    user,
    action === "rotate" ? "credentials:regenerate" : `credentials:${action}`,
  );
  const receipt = await service.execute({
    user,
    context,
    command: {
      action,
      applicationId,
      credentialId,
      environment,
      idempotencyKey: request.headers.get("idempotency-key") ?? "",
      reason: transitionBody?.data.reason,
    },
  });
  return new Response(JSON.stringify({ contractVersion: "2", ...receipt }), {
    headers: responseHeaders(receipt.requestId),
  });
}

function methodNotAllowed() {
  return new ApiError(
    405,
    "method_not_allowed",
    "El método no está permitido.",
  );
}
