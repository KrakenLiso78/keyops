import { AirtableClient } from "./airtable/AirtableClient";
import { UserRepository } from "./airtable/UserRepository";
import { ApplicationRepository } from "./airtable/ApplicationRepository";
import { CredentialRepository } from "./airtable/CredentialRepository";
import { DeliveryGrantRepository } from "./airtable/DeliveryGrantRepository";
import { IdempotencyRepository } from "./airtable/IdempotencyRepository";
import { AuditEventRepository } from "./airtable/AuditEventRepository";
import { AuditRecorder } from "./audit/AuditRecorder";
import type { AuditSink } from "./audit/AuditSink";
import { validateEnv, type WorkerEnv } from "./config/env";
import { ApiError, errorResponse } from "./http/ApiError";
import { createRequestContext } from "./http/requestContext";
import { ApplicationCache } from "./cache/applicationCache";
import { applicationsRoute } from "./routes/v1/applications";
import { healthResponse } from "./routes/v1/health";
import { credentialsRoute } from "./routes/v1/credentials";
import { createSession, restoreSession } from "./routes/v1/sessions";

function environmentFromUrl(url: URL): "test" | "production" | undefined {
  const value = url.searchParams.get("environment");
  return value === "test" || value === "production" ? value : undefined;
}

function safeDecodePathPart(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function fallbackAuditDescriptor(request: Request, url: URL) {
  const method = request.method;
  if (url.pathname === "/v1/sessions" && method === "POST") {
    return { operation: "session.create.v1", resourceType: "session" };
  }
  if (url.pathname === "/v1/session" && method === "GET") {
    return { operation: "session.restore.v1", resourceType: "session" };
  }
  if (url.pathname === "/v1/applications" && method === "GET") {
    return {
      operation: "application.list.v1",
      resourceType: "application_collection",
    };
  }
  const application = url.pathname.match(/^\/v1\/applications\/([^/]+)/u);
  if (application) {
    const resourceId = safeDecodePathPart(application[1]!);
    if (url.pathname.endsWith("/management")) {
      return {
        operation: "application.update.v1",
        resourceType: "application",
        resourceId,
        applicationId: resourceId,
      };
    }
    if (url.pathname.includes("/credentials")) {
      const operation = url.pathname.endsWith("/regenerations")
        ? "credential.regenerate.v1"
        : url.pathname.endsWith("/deliveries")
          ? "credential.delivery.v1"
          : url.pathname.endsWith("/transitions")
            ? "credential.transition.v1"
            : "credential.issue.v1";
      return {
        operation,
        resourceType: "credential",
        applicationId: resourceId,
      };
    }
    return {
      operation: "application.view.v1",
      resourceType: "application",
      resourceId,
      applicationId: resourceId,
    };
  }
  if (/^\/v1\/deliveries\/[^/]+\/artifact$/u.test(url.pathname)) {
    return { operation: "delivery.consume.v1", resourceType: "delivery" };
  }
  if (url.pathname === "/v1/audit-events") {
    return { operation: "audit.list.v1", resourceType: "audit" };
  }
  return { operation: "request.handle.v1", resourceType: "route" };
}

export async function handleRequest(
  request: Request,
  env: WorkerEnv,
): Promise<Response> {
  const context = createRequestContext(request);
  let audit: AuditSink | undefined;
  try {
    const url = new URL(request.url);
    if (url.pathname === "/v1/health" && request.method === "GET") {
      return healthResponse(context.requestId);
    }

    if (url.pathname.startsWith("/v1/")) {
      const config = validateEnv(env);
      const airtable = new AirtableClient({
        baseId: config.airtableBaseId,
        token: config.airtablePat,
      });
      const users = new UserRepository(airtable);
      audit = new AuditRecorder(new AuditEventRepository(airtable));
      const sessionDependencies = {
        users,
        demoCredentials: config.demoCredentials,
        signingKey: config.sessionSigningKey,
        audit,
      };
      if (url.pathname === "/v1/sessions" && request.method === "POST") {
        return await createSession(request, context, sessionDependencies);
      }
      if (url.pathname === "/v1/session" && request.method === "GET") {
        return await restoreSession(request, context, sessionDependencies);
      }
      const credentialResponse = await credentialsRoute(request, context, {
        users,
        credentials: new CredentialRepository(airtable),
        deliveries: new DeliveryGrantRepository(airtable),
        idempotency: new IdempotencyRepository(airtable),
        signingKey: config.sessionSigningKey,
        deliveryPepper: config.deliveryPepper,
        audit,
        invalidateApplications: (environment) =>
          applicationCache.invalidateEnvironment(environment),
      });
      if (credentialResponse) return credentialResponse;
      const applicationResponse = await applicationsRoute(request, context, {
        users,
        applications: new ApplicationRepository(airtable),
        signingKey: config.sessionSigningKey,
        cache: applicationCache,
        audit,
      });
      if (applicationResponse) return applicationResponse;
      throw new ApiError(
        404,
        "not_found",
        "No se encontró el recurso solicitado.",
      );
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    throw new ApiError(
      404,
      "not_found",
      "No se encontró el recurso solicitado.",
    );
  } catch (error) {
    let responseError = error;
    const url = new URL(request.url);
    if (audit && url.pathname.startsWith("/v1/") && !context.auditRecorded) {
      const controlled =
        error instanceof ApiError
          ? error
          : new ApiError(
              500,
              "unexpected_error",
              "No se pudo completar la solicitud.",
              true,
            );
      try {
        await audit.append({
          actor: context.actor,
          ...fallbackAuditDescriptor(request, url),
          environment: environmentFromUrl(url),
          result: controlled.status < 500 ? "rejected" : "failed",
          failureCode: controlled.code,
          context,
        });
      } catch (auditError) {
        responseError =
          auditError instanceof ApiError
            ? auditError
            : new ApiError(
                503,
                "audit_unavailable",
                "No se pudo registrar la evidencia de la operación.",
                true,
              );
      }
    }
    return errorResponse(responseError, context.requestId);
  }
}

const applicationCache = new ApplicationCache();

export default { fetch: handleRequest } satisfies ExportedHandler<WorkerEnv>;
