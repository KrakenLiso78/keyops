import { AirtableClient } from "./airtable/AirtableClient";
import { UserRepository } from "./airtable/UserRepository";
import { ApplicationRepository } from "./airtable/ApplicationRepository";
import { CredentialRepository } from "./airtable/CredentialRepository";
import { DeliveryGrantRepository } from "./airtable/DeliveryGrantRepository";
import { IdempotencyRepository } from "./airtable/IdempotencyRepository";
import { noOpAuditSink } from "./audit/AuditSink";
import { validateEnv, type WorkerEnv } from "./config/env";
import { ApiError, errorResponse } from "./http/ApiError";
import { createRequestContext } from "./http/requestContext";
import { ApplicationCache } from "./cache/applicationCache";
import { applicationsRoute } from "./routes/v1/applications";
import { healthResponse } from "./routes/v1/health";
import { credentialsRoute } from "./routes/v1/credentials";
import { createSession, restoreSession } from "./routes/v1/sessions";

export async function handleRequest(
  request: Request,
  env: WorkerEnv,
): Promise<Response> {
  const context = createRequestContext(request);
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
      const sessionDependencies = {
        users,
        demoCredentials: config.demoCredentials,
        signingKey: config.sessionSigningKey,
        audit: noOpAuditSink,
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
        audit: noOpAuditSink,
        invalidateApplications: (environment) =>
          applicationCache.invalidateEnvironment(environment),
      });
      if (credentialResponse) return credentialResponse;
      const applicationResponse = await applicationsRoute(request, context, {
        users,
        applications: new ApplicationRepository(airtable),
        signingKey: config.sessionSigningKey,
        cache: applicationCache,
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
    return errorResponse(error, context.requestId);
  }
}

const applicationCache = new ApplicationCache();

export default { fetch: handleRequest } satisfies ExportedHandler<WorkerEnv>;
