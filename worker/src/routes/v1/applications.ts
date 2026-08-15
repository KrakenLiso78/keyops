import { z } from "zod";
import type { ApplicationRepository } from "../../airtable/ApplicationRepository";
import {
  credentialStateSchema,
  environmentSchema,
} from "../../airtable/applicationSchema";
import type { UserRepository } from "../../airtable/UserRepository";
import { listApplications } from "../../applications/listApplications";
import { updateManagement } from "../../applications/updateManagement";
import { authenticate } from "../../auth/authenticate";
import { authorize } from "../../auth/authorize";
import {
  ApplicationCache,
  applicationCacheKey,
} from "../../cache/applicationCache";
import { ApiError } from "../../http/ApiError";
import type { RequestContext } from "../../http/requestContext";

const listQuerySchema = z.object({
  environment: environmentSchema,
  query: z.string().max(200).optional(),
  state: credentialStateSchema.optional(),
  sort: z.enum(["name", "lastChangedAt"]).default("name"),
  page: z.coerce.number().int().min(1).default(1),
});

export interface ApplicationRouteDependencies {
  users: UserRepository;
  applications: ApplicationRepository;
  signingKey: string;
  cache: ApplicationCache;
}

const responseHeaders = (context: RequestContext) => ({
  "cache-control": "private, max-age=5",
  "x-request-id": context.requestId,
});

function environmentFrom(url: URL): "test" | "production" {
  const parsed = environmentSchema.safeParse(
    url.searchParams.get("environment"),
  );
  if (!parsed.success) {
    throw new ApiError(400, "invalid_environment", "El ambiente no es válido.");
  }
  return parsed.data;
}

export async function applicationsRoute(
  request: Request,
  context: RequestContext,
  dependencies: ApplicationRouteDependencies,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  const match = url.pathname.match(
    /^\/v1\/applications\/([^/]+)(?:\/(management))?$/u,
  );
  const isCollection = url.pathname === "/v1/applications";
  if (!isCollection && !match) return undefined;

  const user = await authenticate(
    request,
    dependencies.users,
    dependencies.signingKey,
  );
  if (isCollection && request.method === "GET") {
    const parsed = listQuerySchema.safeParse(
      Object.fromEntries(url.searchParams),
    );
    if (!parsed.success)
      throw new ApiError(400, "invalid_query", "La consulta no es válida.");
    const key = applicationCacheKey({
      userId: user.id,
      permissionScope: user.permissions.join(","),
      environment: parsed.data.environment,
      query: JSON.stringify(parsed.data),
    });
    const cached =
      dependencies.cache.get<Awaited<ReturnType<typeof listApplications>>>(key);
    const page =
      cached ??
      (await listApplications(user, dependencies.applications, parsed.data));
    if (!cached) dependencies.cache.set(key, page);
    return Response.json(
      { contractVersion: "1", ...page },
      { headers: responseHeaders(context) },
    );
  }

  const applicationId = decodeURIComponent(match![1]!);
  const environment = environmentFrom(url);
  if (!match![2] && request.method === "GET") {
    authorize(user, "applications:read");
    const key = applicationCacheKey({
      userId: user.id,
      permissionScope: user.permissions.join(","),
      environment,
      query: `detail:${applicationId}`,
    });
    const cached =
      dependencies.cache.get<Awaited<ReturnType<ApplicationRepository["get"]>>>(
        key,
      );
    const application =
      cached ??
      (await dependencies.applications.get(environment, applicationId));
    if (!cached) dependencies.cache.set(key, application);
    return Response.json(
      { contractVersion: "1", application },
      { headers: responseHeaders(context) },
    );
  }

  if (match![2] === "management" && request.method === "PATCH") {
    const rawVersion = request.headers.get("if-match");
    if (!rawVersion)
      throw new ApiError(
        428,
        "if_match_required",
        "Falta la versión de la aplicación.",
      );
    const application = await updateManagement(
      user,
      dependencies.applications,
      {
        environment,
        applicationId,
        expectedUpdatedAt: rawVersion.replace(/^"|"$/gu, ""),
        command: await request.json().catch(() => undefined),
      },
    );
    dependencies.cache.invalidateEnvironment(environment);
    return Response.json(
      { contractVersion: "1", application },
      {
        headers: {
          ...responseHeaders(context),
          etag: `"${application.updatedAt}"`,
        },
      },
    );
  }

  throw new ApiError(405, "method_not_allowed", "El método no está permitido.");
}
