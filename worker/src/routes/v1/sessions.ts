import { z } from "zod";
import type { UserRepository } from "../../airtable/UserRepository";
import type { AuthorizedUser } from "../../airtable/userSchema";
import type { AuditSink } from "../../audit/AuditSink";
import { authenticate } from "../../auth/authenticate";
import { issueSessionToken } from "../../auth/sessionToken";
import { ApiError } from "../../http/ApiError";
import { completeOperation } from "../../http/completeOperation";
import {
  type RequestContext,
  withRequestActor,
} from "../../http/requestContext";

const signInSchema = z
  .object({
    loginIdentifier: z.string().min(1).max(200),
    password: z.string().min(1).max(500),
  })
  .strict();

export interface SessionRouteDependencies {
  users: UserRepository;
  demoCredentials: Readonly<Record<string, string>>;
  signingKey: string;
  audit: AuditSink;
}

const publicUser = (user: AuthorizedUser) => ({
  id: user.id,
  loginIdentifier: user.loginIdentifier,
  displayName: user.displayName,
  profile: user.profile,
  enabled: user.enabled,
  permissions: user.permissions,
});

async function digest(value: string): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

async function equalSecret(
  candidate: string,
  expected: string,
): Promise<boolean> {
  const [left, right] = await Promise.all([
    digest(candidate),
    digest(expected),
  ]);
  let difference = 0;
  left.forEach((byte, index) => (difference |= byte ^ right[index]!));
  return difference === 0;
}

export async function createSession(
  request: Request,
  context: RequestContext,
  dependencies: SessionRouteDependencies,
): Promise<Response> {
  const body = signInSchema.safeParse(
    await request.json().catch(() => undefined),
  );
  if (!body.success) {
    const error = new ApiError(
      400,
      "invalid_request",
      "Los datos de acceso no son válidos.",
    );
    await dependencies.audit.append({
      operation: "session.create.v1",
      resourceType: "session",
      result: "rejected",
      failureCode: error.code,
      context,
    });
    throw error;
  }
  const identifier = body.data.loginIdentifier.trim().toLowerCase();
  const user = await dependencies.users.findByLoginIdentifier(identifier);
  const expected =
    dependencies.demoCredentials[identifier] ?? "invalid-placeholder-secret";
  const validSecret = await equalSecret(body.data.password, expected);
  if (user) withRequestActor(context, user);
  const completed = await completeOperation({
    audit: dependencies.audit,
    attempt: {
      actor: user,
      operation: "session.create.v1",
      resourceType: "session",
      resourceId: user?.id,
      context,
    },
    execute: async () => {
      if (
        !user?.enabled ||
        !validSecret ||
        !(identifier in dependencies.demoCredentials)
      ) {
        throw new ApiError(
          401,
          "invalid_credentials",
          "Los datos de acceso no son válidos.",
        );
      }
      return {
        user,
        session: await issueSessionToken(user.id, dependencies.signingKey),
      };
    },
  });
  const { session, user: confirmedUser } = completed.value;
  return Response.json(
    {
      contractVersion: "1",
      accessToken: session.token,
      expiresAt: session.expiresAt,
      user: publicUser(confirmedUser),
      requestId: context.requestId,
      auditEventId: completed.auditEventId,
    },
    {
      headers: {
        "cache-control": "no-store",
        "x-request-id": context.requestId,
      },
    },
  );
}

export async function restoreSession(
  request: Request,
  context: RequestContext,
  dependencies: SessionRouteDependencies,
): Promise<Response> {
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
      operation: "session.restore.v1",
      resourceType: "session",
      resourceId: user.id,
      context,
    },
    execute: async () => publicUser(user),
  });
  return Response.json(
    {
      contractVersion: "1",
      user: completed.value,
      requestId: context.requestId,
      auditEventId: completed.auditEventId,
    },
    {
      headers: {
        "cache-control": "no-store",
        "x-request-id": context.requestId,
      },
    },
  );
}
