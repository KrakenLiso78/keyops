import type { CredentialRepository } from "../../airtable/CredentialRepository";
import type { DeliveryGrantRepository } from "../../airtable/DeliveryGrantRepository";
import type { IdempotencyRepository } from "../../airtable/IdempotencyRepository";
import type { UserRepository } from "../../airtable/UserRepository";
import { environmentSchema } from "../../airtable/applicationSchema";
import type { AuditSink } from "../../audit/AuditSink";
import { authenticate } from "../../auth/authenticate";
import { consumeDelivery } from "../../credentials/consumeDelivery";
import { createDelivery } from "../../credentials/createDelivery";
import { issueCredential } from "../../credentials/issueCredential";
import { regenerateCredential } from "../../credentials/regenerateCredential";
import { transitionCredential } from "../../credentials/transitionCredential";
import { runCredentialOperation } from "../../credentials/operationService";
import { ApiError } from "../../http/ApiError";
import type { RequestContext } from "../../http/requestContext";
import { z } from "zod";

export interface CredentialRouteDependencies {
  users: UserRepository;
  credentials: CredentialRepository;
  deliveries: DeliveryGrantRepository;
  idempotency: IdempotencyRepository;
  audit: AuditSink;
  signingKey: string;
  deliveryPepper: string;
  invalidateApplications: (environment: "test" | "production") => void;
}

const transitionBodySchema = z
  .object({
    action: z.enum(["suspend", "reactivate", "revoke"]),
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

const artifactBodySchema = z
  .object({ code: z.string().regex(/^\d{6}$/u) })
  .strict();

function environmentFrom(url: URL): "test" | "production" {
  const result = environmentSchema.safeParse(
    url.searchParams.get("environment"),
  );
  if (!result.success) {
    throw new ApiError(400, "invalid_environment", "El ambiente no es válido.");
  }
  return result.data;
}

export async function credentialsRoute(
  request: Request,
  context: RequestContext,
  dependencies: CredentialRouteDependencies,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  const issueMatch = url.pathname.match(
    /^\/v1\/applications\/([^/]+)\/credentials$/u,
  );
  const regenerationMatch = url.pathname.match(
    /^\/v1\/applications\/([^/]+)\/credentials\/([^/]+)\/regenerations$/u,
  );
  const transitionMatch = url.pathname.match(
    /^\/v1\/applications\/([^/]+)\/credentials\/([^/]+)\/transitions$/u,
  );
  const deliveryMatch = url.pathname.match(
    /^\/v1\/applications\/([^/]+)\/credentials\/([^/]+)\/deliveries$/u,
  );
  const artifactMatch = url.pathname.match(
    /^\/v1\/deliveries\/([^/]+)\/artifact$/u,
  );
  if (
    !issueMatch &&
    !regenerationMatch &&
    !transitionMatch &&
    !deliveryMatch &&
    !artifactMatch
  ) {
    return undefined;
  }
  if (request.method !== "POST") {
    throw new ApiError(
      405,
      "method_not_allowed",
      "El método no está permitido.",
    );
  }
  if (artifactMatch) {
    const body = artifactBodySchema.safeParse(
      await request.json().catch(() => undefined),
    );
    if (!body.success) {
      throw new ApiError(
        400,
        "invalid_delivery_code",
        "El código de entrega no es válido.",
      );
    }
    const artifact = await consumeDelivery({
      deliveryId: decodeURIComponent(artifactMatch[1]!),
      code: body.data.code,
      deliveryPepper: dependencies.deliveryPepper,
      credentials: dependencies.credentials,
      deliveries: dependencies.deliveries,
    });
    return Response.json(
      { contractVersion: "1", ...artifact },
      {
        headers: {
          "cache-control": "no-store",
          "x-request-id": context.requestId,
        },
      },
    );
  }
  const user = await authenticate(
    request,
    dependencies.users,
    dependencies.signingKey,
  );
  const environment = environmentFrom(url);
  const matched =
    issueMatch ?? regenerationMatch ?? transitionMatch ?? deliveryMatch!;
  const applicationId = decodeURIComponent(matched[1]!);
  const credentialId =
    regenerationMatch || transitionMatch || deliveryMatch
      ? decodeURIComponent(matched[2]!)
      : undefined;
  const transitionBody = transitionMatch
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
  const operation = issueMatch
    ? "issue"
    : regenerationMatch
      ? "regenerate"
      : deliveryMatch
        ? "delivery"
        : transitionBody!.data.action;
  const receipt = await runCredentialOperation({
    user,
    environment,
    idempotencyKey: request.headers.get("idempotency-key") ?? "",
    operation,
    resourceType: issueMatch ? "application" : "credential",
    resourceId: credentialId ?? applicationId,
    body: transitionBody?.data,
    context,
    dependencies: {
      idempotency: dependencies.idempotency,
      audit: dependencies.audit,
      deliveryPepper: dependencies.deliveryPepper,
    },
    execute: (operationId) => {
      const shared = {
        user,
        environment,
        applicationId,
        operationId,
        origin: url.origin,
        deliveryPepper: dependencies.deliveryPepper,
        credentials: dependencies.credentials,
        deliveries: dependencies.deliveries,
      };
      if (issueMatch) return issueCredential(shared);
      if (regenerationMatch) {
        return regenerateCredential({ ...shared, credentialId: credentialId! });
      }
      if (deliveryMatch) {
        return createDelivery({ ...shared, credentialId: credentialId! });
      }
      return transitionCredential({
        user,
        environment,
        applicationId,
        credentialId: credentialId!,
        action: transitionBody!.data.action,
        reason: transitionBody!.data.reason,
        operationId,
        credentials: dependencies.credentials,
        deliveries: dependencies.deliveries,
      });
    },
  });
  dependencies.invalidateApplications(environment);
  return Response.json(
    { contractVersion: "1", ...receipt },
    {
      headers: {
        "cache-control": "no-store",
        "x-request-id": receipt.requestId,
      },
    },
  );
}
