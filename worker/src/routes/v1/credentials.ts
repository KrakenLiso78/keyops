import type { CredentialRepository } from "../../airtable/CredentialRepository";
import type { DeliveryGrantRepository } from "../../airtable/DeliveryGrantRepository";
import type { IdempotencyRepository } from "../../airtable/IdempotencyRepository";
import type { UserRepository } from "../../airtable/UserRepository";
import { environmentSchema } from "../../airtable/applicationSchema";
import type { AuditSink } from "../../audit/AuditSink";
import { authenticate } from "../../auth/authenticate";
import { issueCredential } from "../../credentials/issueCredential";
import { regenerateCredential } from "../../credentials/regenerateCredential";
import { runCredentialOperation } from "../../credentials/operationService";
import { ApiError } from "../../http/ApiError";
import type { RequestContext } from "../../http/requestContext";

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
  if (!issueMatch && !regenerationMatch) return undefined;
  if (request.method !== "POST") {
    throw new ApiError(
      405,
      "method_not_allowed",
      "El método no está permitido.",
    );
  }
  const user = await authenticate(
    request,
    dependencies.users,
    dependencies.signingKey,
  );
  const environment = environmentFrom(url);
  const applicationId = decodeURIComponent(
    (issueMatch ?? regenerationMatch)![1]!,
  );
  const credentialId = regenerationMatch
    ? decodeURIComponent(regenerationMatch[2]!)
    : undefined;
  const operation = issueMatch ? "issue" : "regenerate";
  const receipt = await runCredentialOperation({
    user,
    environment,
    idempotencyKey: request.headers.get("idempotency-key") ?? "",
    operation,
    resourceType: issueMatch ? "application" : "credential",
    resourceId: credentialId ?? applicationId,
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
      return issueMatch
        ? issueCredential(shared)
        : regenerateCredential({ ...shared, credentialId: credentialId! });
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
