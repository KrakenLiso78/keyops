import { AirtableClient } from "./airtable/AirtableClient";
import { UserRepository } from "./airtable/UserRepository";
import { noOpAuditSink } from "./audit/AuditSink";
import { validateEnv, type WorkerEnv } from "./config/env";
import { ApiError, errorResponse } from "./http/ApiError";
import { createRequestContext } from "./http/requestContext";
import { healthResponse } from "./routes/v1/health";
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
      const users = new UserRepository(
        new AirtableClient({
          baseId: config.airtableBaseId,
          token: config.airtablePat,
        }),
      );
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

export default { fetch: handleRequest } satisfies ExportedHandler<WorkerEnv>;
