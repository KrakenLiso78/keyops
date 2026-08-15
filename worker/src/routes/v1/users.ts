import type { UserRepository } from "../../airtable/UserRepository";
import type { AuthorizedUser } from "../../airtable/userSchema";
import type { AuditSink } from "../../audit/AuditSink";
import { authenticate } from "../../auth/authenticate";
import { ApiError } from "../../http/ApiError";
import { completeOperation } from "../../http/completeOperation";
import {
  type RequestContext,
  withRequestActor,
} from "../../http/requestContext";
import {
  listAuthorizedUsers,
  registerAuthorizedUser,
  updateAuthorizedUser,
} from "../../users/authorizedUserService";

export interface UserRouteDependencies {
  users: UserRepository;
  signingKey: string;
  audit: AuditSink;
}

function publicUser(user: AuthorizedUser) {
  if (!user.corporateIssuer || !user.corporateSubject || !user.updatedAt) {
    throw new ApiError(
      503,
      "invalid_authorized_user",
      "La autorización corporativa del usuario está incompleta.",
      true,
    );
  }
  return {
    id: user.id,
    corporateIssuer: user.corporateIssuer,
    corporateSubject: user.corporateSubject,
    displayName: user.displayName,
    profile: user.profile,
    enabled: user.enabled,
    permissions: user.permissions,
    updatedAt: user.updatedAt,
  };
}

export async function usersRoute(
  request: Request,
  context: RequestContext,
  dependencies: UserRouteDependencies,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  const match = url.pathname.match(/^\/v1\/users\/([^/]+)$/u);
  if (url.pathname !== "/v1/users" && !match) return undefined;
  const actor = await authenticate(
    request,
    dependencies.users,
    dependencies.signingKey,
  );
  withRequestActor(context, actor);

  if (url.pathname === "/v1/users" && request.method === "GET") {
    const completed = await completeOperation({
      audit: dependencies.audit,
      attempt: {
        actor,
        operation: "user.list.v1",
        resourceType: "user_collection",
        context,
      },
      execute: () => listAuthorizedUsers(actor, dependencies.users),
    });
    return Response.json(completed.value.map(publicUser), {
      headers: {
        "cache-control": "no-store",
        "x-request-id": context.requestId,
      },
    });
  }

  if (url.pathname === "/v1/users" && request.method === "POST") {
    const completed = await completeOperation({
      audit: dependencies.audit,
      attempt: {
        actor,
        operation: "user.register.v1",
        resourceType: "user",
        context,
      },
      execute: async () =>
        registerAuthorizedUser(
          actor,
          dependencies.users,
          await request.json().catch(() => undefined),
        ),
    });
    return Response.json(publicUser(completed.value), {
      headers: {
        "cache-control": "no-store",
        "x-request-id": context.requestId,
      },
    });
  }

  if (match && request.method === "PATCH") {
    const userId = decodeURIComponent(match[1]!);
    const expectedUpdatedAt = request.headers
      .get("if-match")
      ?.replace(/^"|"$/gu, "");
    if (!expectedUpdatedAt) {
      throw new ApiError(
        428,
        "if_match_required",
        "Falta la versión del usuario.",
      );
    }
    const completed = await completeOperation({
      audit: dependencies.audit,
      attempt: {
        actor,
        operation: "user.update.v1",
        resourceType: "user",
        resourceId: userId,
        context,
      },
      execute: async () =>
        updateAuthorizedUser(actor, dependencies.users, {
          userId,
          expectedUpdatedAt,
          command: await request.json().catch(() => undefined),
        }),
    });
    return Response.json(publicUser(completed.value), {
      headers: {
        "cache-control": "no-store",
        "x-request-id": context.requestId,
        etag: `"${completed.value.updatedAt}"`,
      },
    });
  }

  throw new ApiError(405, "method_not_allowed", "El método no está permitido.");
}
