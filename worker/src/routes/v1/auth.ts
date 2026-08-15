import type { UserRepository } from "../../airtable/UserRepository";
import type { AuditSink } from "../../audit/AuditSink";
import { authenticate } from "../../auth/authenticate";
import {
  clearAuthorizationCookie,
  consumeAuthorizationTransaction,
  createAuthorizationTransaction,
  type AuthorizationReplayStore,
} from "../../auth/authorizationTransaction";
import { authorizeCorporateIdentity } from "../../auth/authorize";
import {
  clearCorporateSessionCookie,
  issueCorporateSession,
} from "../../auth/corporateSession";
import { readCookie } from "../../auth/cookies";
import { ApiError } from "../../http/ApiError";
import {
  type RequestContext,
  withRequestActor,
} from "../../http/requestContext";
import type { OidcProviderPort } from "../../identity/OidcProviderPort";
import { validateIdToken } from "../../identity/oidcValidation";

interface CorporateIdentityConfiguration {
  issuer: string;
  clientId: string;
  redirectUri: string;
}

export interface CorporateAuthRouteDependencies {
  users: UserRepository;
  audit: AuditSink;
  signingKey: string;
  oidc?: OidcProviderPort;
  configuration?: CorporateIdentityConfiguration;
  replayStore: AuthorizationReplayStore;
  now?: () => number;
}

function configured(dependencies: CorporateAuthRouteDependencies) {
  if (!dependencies.oidc || !dependencies.configuration) {
    throw new ApiError(
      503,
      "corporate_identity_not_configured",
      "La identidad corporativa no está configurada.",
      true,
    );
  }
  return {
    provider: dependencies.oidc,
    configuration: dependencies.configuration,
  };
}

async function discovery(dependencies: CorporateAuthRouteDependencies) {
  const { provider, configuration } = configured(dependencies);
  const document = await provider.discovery();
  if (
    document.issuer !== configuration.issuer ||
    !document.code_challenge_methods_supported?.includes("S256") ||
    !document.id_token_signing_alg_values_supported?.includes("RS256")
  ) {
    throw new ApiError(
      503,
      "invalid_identity_configuration",
      "La configuración del proveedor de identidad no es compatible.",
      true,
    );
  }
  return { provider, configuration, document };
}

async function auditResult(
  dependencies: CorporateAuthRouteDependencies,
  context: RequestContext,
  input: {
    operation: string;
    resourceId?: string;
    result: "succeeded" | "rejected" | "failed";
    failureCode?: string;
  },
) {
  await dependencies.audit.append({
    actor: context.actor,
    operation: input.operation,
    resourceType: "session",
    resourceId: input.resourceId,
    result: input.result,
    failureCode: input.failureCode,
    context,
  });
}

function controlled(error: unknown) {
  return error instanceof ApiError
    ? error
    : new ApiError(
        500,
        "unexpected_error",
        "No se pudo completar el acceso corporativo.",
        true,
      );
}

export async function corporateAuthRoute(
  request: Request,
  context: RequestContext,
  dependencies: CorporateAuthRouteDependencies,
): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (url.pathname === "/v1/auth/login" && request.method === "GET") {
    try {
      const { configuration, document } = await discovery(dependencies);
      const transaction = await createAuthorizationTransaction(
        dependencies.signingKey,
        url.searchParams.get("returnPath"),
        dependencies.now?.(),
      );
      const authorization = new URL(document.authorization_endpoint);
      authorization.search = new URLSearchParams({
        response_type: "code",
        client_id: configuration.clientId,
        redirect_uri: configuration.redirectUri,
        scope: "openid",
        state: transaction.state,
        nonce: transaction.nonce,
        code_challenge: transaction.challenge,
        code_challenge_method: "S256",
      }).toString();
      await auditResult(dependencies, context, {
        operation: "identity.login.v1",
        result: "succeeded",
      });
      return new Response(null, {
        status: 302,
        headers: {
          location: authorization.toString(),
          "set-cookie": transaction.cookie,
          "cache-control": "no-store",
          "x-request-id": context.requestId,
        },
      });
    } catch (error) {
      const failure = controlled(error);
      await auditResult(dependencies, context, {
        operation: "identity.login.v1",
        result: failure.status < 500 ? "rejected" : "failed",
        failureCode: failure.code,
      });
      throw failure;
    }
  }

  if (url.pathname === "/v1/auth/callback" && request.method === "GET") {
    try {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const transactionCookie = readCookie(request, "keyops_oidc_tx");
      if (!code || !state || !transactionCookie) {
        throw new ApiError(
          401,
          "invalid_oidc_callback",
          "La respuesta del proveedor de identidad no es válida.",
        );
      }
      const { provider, configuration, document } =
        await discovery(dependencies);
      const transaction = await consumeAuthorizationTransaction({
        cookieValue: transactionCookie,
        suppliedState: state,
        secret: dependencies.signingKey,
        replayStore: dependencies.replayStore,
        now: dependencies.now?.(),
      });
      const tokens = await provider.exchangeCode({
        code,
        codeVerifier: transaction.verifier,
        redirectUri: configuration.redirectUri,
      });
      const claims = await validateIdToken({
        idToken: tokens.id_token,
        jwks: await provider.jwks(document.jwks_uri),
        expectedIssuer: configuration.issuer,
        expectedAudience: configuration.clientId,
        expectedNonce: transaction.nonce,
        configuredRedirectUri: configuration.redirectUri,
        callbackRedirectUri: configuration.redirectUri,
        now: dependencies.now?.(),
      });
      const user = await authorizeCorporateIdentity(
        dependencies.users,
        claims.iss,
        claims.sub,
      );
      withRequestActor(context, user);
      const validatedAt = new Date(
        dependencies.now?.() ?? Date.now(),
      ).toISOString();
      const confirmedUser = await dependencies.users.markIdentityValidated(
        user.id,
        {
          displayName: claims.name,
          identityValidatedAt: validatedAt,
        },
      );
      withRequestActor(context, confirmedUser);
      const session = await issueCorporateSession({
        userId: confirmedUser.id,
        issuer: claims.iss,
        subject: claims.sub,
        secret: dependencies.signingKey,
        now: dependencies.now?.(),
      });
      await auditResult(dependencies, context, {
        operation: "identity.callback.v1",
        resourceId: confirmedUser.id,
        result: "succeeded",
      });
      const headers = new Headers({
        location: transaction.returnPath,
        "cache-control": "no-store",
        "x-request-id": context.requestId,
      });
      headers.append("set-cookie", clearAuthorizationCookie);
      headers.append("set-cookie", session.cookie);
      return new Response(null, { status: 302, headers });
    } catch (error) {
      const failure = controlled(error);
      await auditResult(dependencies, context, {
        operation: "identity.callback.v1",
        resourceId: context.actor?.id,
        result: failure.status < 500 ? "rejected" : "failed",
        failureCode: failure.code,
      });
      throw failure;
    }
  }

  if (url.pathname === "/v1/auth/logout" && request.method === "POST") {
    let user;
    try {
      user = await authenticate(
        request,
        dependencies.users,
        dependencies.signingKey,
      );
      withRequestActor(context, user);
    } catch {
      // El cierre siempre limpia la cookie, incluso si la sesión ya ha caducado.
    }
    await auditResult(dependencies, context, {
      operation: "identity.logout.v1",
      resourceId: user?.id,
      result: "succeeded",
    });
    return new Response(null, {
      status: 204,
      headers: {
        "set-cookie": clearCorporateSessionCookie,
        "cache-control": "no-store",
        "x-request-id": context.requestId,
      },
    });
  }

  return undefined;
}
