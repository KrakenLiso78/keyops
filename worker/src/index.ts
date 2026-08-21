import { UserRepository } from "./airtable/UserRepository";
import { CredentialRepository } from "./airtable/CredentialRepository";
import { DeliveryGrantRepository } from "./airtable/DeliveryGrantRepository";
import { IdempotencyRepository } from "./airtable/IdempotencyRepository";
import { AuditEventRepository } from "./airtable/AuditEventRepository";
import {
  AuditRecorder,
  ComplianceAuditRecorder,
  DualAuditRecorder,
} from "./audit/AuditRecorder";
import type { AuditSink } from "./audit/AuditSink";
import { validateEnv, type WorkerEnv } from "./config/env";
import { ApiError, errorResponse } from "./http/ApiError";
import { createRequestContext } from "./http/requestContext";
import { CatalogCache } from "./cache/catalogCache";
import { applicationsRoute } from "./routes/v1/applications";
import { healthResponse } from "./routes/v1/health";
import { credentialsRoute } from "./routes/v1/credentials";
import { createSession, restoreSession } from "./routes/v1/sessions";
import { auditRoute } from "./routes/v1/audit";
import { createWorkerDependencies } from "./composition/createWorkerDependencies";
import { corporateAuthRoute } from "./routes/v1/auth";
import { InMemoryAuthorizationReplayStore } from "./auth/authorizationTransaction";
import { usersRoute } from "./routes/v1/users";
import { fakeRoute } from "./routes/v1/fake";
import { runtimeConfigurationRoute } from "./routes/v1/runtimeConfiguration";
import { RuntimeConfigurationRepository } from "./runtime/RuntimeConfigurationRepository";
import { RuntimeModeCache } from "./runtime/RuntimeModeCache";
import { v2Route } from "./routes/v2";

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
  const realApplication = url.pathname.match(
    /^\/v2\/applications\/([^/]+)\/credentials(?:\/([^/]+)\/(regenerations|transitions))?$/u,
  );
  if (realApplication) {
    const applicationId = safeDecodePathPart(realApplication[1]!);
    const credentialId = realApplication[2]
      ? safeDecodePathPart(realApplication[2])
      : undefined;
    return {
      operation:
        realApplication[3] === "regenerations"
          ? "credential.rotate.v2"
          : realApplication[3] === "transitions"
            ? "credential.transition.v2"
            : "credential.issue.v2",
      resourceType: "real_credential",
      resourceId: credentialId ?? applicationId,
      applicationId,
      credentialId,
    };
  }
  if (/^\/v2\/operations\/[^/]+$/u.test(url.pathname) && method === "GET") {
    return {
      operation: "credential.status.v2",
      resourceType: "real_operation",
    };
  }
  if (url.pathname === "/v1/sessions" && method === "POST") {
    return { operation: "session.create.v1", resourceType: "session" };
  }
  if (url.pathname === "/v1/session" && method === "GET") {
    return { operation: "session.restore.v1", resourceType: "session" };
  }
  if (url.pathname === "/v1/auth/login" && method === "GET") {
    return { operation: "identity.login.v1", resourceType: "session" };
  }
  if (url.pathname === "/v1/auth/callback" && method === "GET") {
    return { operation: "identity.callback.v1", resourceType: "session" };
  }
  if (url.pathname === "/v1/auth/logout" && method === "POST") {
    return { operation: "identity.logout.v1", resourceType: "session" };
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
  if (url.pathname === "/v2/audit-events") {
    return { operation: "audit.list.v2", resourceType: "audit_collection" };
  }
  if (/^\/v2\/audit-events\/[^/]+\/integrity$/u.test(url.pathname)) {
    return {
      operation: "audit.integrity.v2",
      resourceType: "compliance_event",
    };
  }
  if (url.pathname === "/v1/users" && method === "GET") {
    return { operation: "user.list.v1", resourceType: "user_collection" };
  }
  if (url.pathname === "/v1/users" && method === "POST") {
    return { operation: "user.register.v1", resourceType: "user" };
  }
  if (url.pathname === "/v1/fake/reset" && method === "POST") {
    return { operation: "fake.reset.v1", resourceType: "demo_dataset" };
  }
  if (url.pathname === "/v1/runtime-configuration" && method === "PUT") {
    return {
      operation: "runtime.mode.update.v1",
      resourceType: "runtime_configuration",
    };
  }
  if (
    url.pathname === "/v1/runtime-configuration/reload" &&
    method === "POST"
  ) {
    return {
      operation: "runtime.mode.reload.v1",
      resourceType: "runtime_configuration",
    };
  }
  const user = url.pathname.match(/^\/v1\/users\/([^/]+)$/u);
  if (user && method === "PATCH") {
    return {
      operation: "user.update.v1",
      resourceType: "user",
      resourceId: safeDecodePathPart(user[1]!),
    };
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
    if (/^\/v[12]\//u.test(url.pathname)) {
      const config = validateEnv(env);
      const bootstrap = createWorkerDependencies(config);
      const { airtable } = bootstrap;
      const runtimeConfiguration = new RuntimeConfigurationRepository(airtable);
      const runtimeMode = await runtimeModeCache.getOrLoad(() =>
        runtimeConfiguration.read(config.mode),
      );
      const runtimeConfig = { ...config, mode: runtimeMode };
      if (url.pathname === "/v1/health" && request.method === "GET") {
        return healthResponse(context.requestId, runtimeMode);
      }
      const core = createWorkerDependencies(runtimeConfig);
      const users = new UserRepository(airtable);
      const auditEvents = new AuditEventRepository(airtable, runtimeMode);
      const functionalAudit = new AuditRecorder(auditEvents);
      const complianceAudit = core.complianceAudit
        ? new ComplianceAuditRecorder(core.complianceAudit)
        : undefined;
      const operationalAudit = complianceAudit
        ? new DualAuditRecorder(complianceAudit, functionalAudit)
        : functionalAudit;
      audit = operationalAudit;
      const sessionDependencies = {
        users,
        demoCredentials: config.demoCredentials,
        signingKey: config.sessionSigningKey,
        audit: operationalAudit,
      };
      if (url.pathname.startsWith("/v2/")) {
        if (!core.complianceAudit) {
          audit = undefined;
          throw new ApiError(
            503,
            "compliance_audit_not_configured",
            "La auditoría de cumplimiento no está configurada.",
          );
        }
        audit = complianceAudit!;
        const response = await v2Route(request, context, {
          users,
          audit,
          compliance: core.complianceAudit,
          signingKey: config.sessionSigningKey,
          real: core.realCredentials,
        });
        if (response) return response;
        throw new ApiError(
          404,
          "not_found",
          "No se encontró el recurso solicitado.",
        );
      }
      audit = operationalAudit;
      const corporateResponse = await corporateAuthRoute(request, context, {
        users,
        audit,
        signingKey: config.sessionSigningKey,
        oidc: core.oidc,
        configuration: config.oidc,
        replayStore: authorizationReplayStore,
      });
      if (corporateResponse) return corporateResponse;
      if (url.pathname === "/v1/sessions" && request.method === "POST") {
        if (config.oidc) {
          throw new ApiError(
            409,
            "corporate_identity_required",
            "El acceso requiere identidad corporativa.",
          );
        }
        return await createSession(request, context, sessionDependencies);
      }
      if (url.pathname === "/v1/session" && request.method === "GET") {
        return await restoreSession(request, context, sessionDependencies);
      }
      const auditResponse = await auditRoute(request, context, {
        users,
        events: auditEvents,
        signingKey: config.sessionSigningKey,
        audit,
      });
      if (auditResponse) return auditResponse;
      const userResponse = await usersRoute(request, context, {
        users,
        signingKey: config.sessionSigningKey,
        audit,
      });
      if (userResponse) return userResponse;
      const runtimeResponse = await runtimeConfigurationRoute(
        request,
        context,
        {
          users,
          configuration: runtimeConfiguration,
          signingKey: config.sessionSigningKey,
          readMode: () =>
            runtimeModeCache.getOrLoad(() =>
              runtimeConfiguration.read(config.mode),
            ),
          reloadMode: async () => {
            runtimeModeCache.clear();
            return runtimeModeCache.getOrLoad(() =>
              runtimeConfiguration.read(config.mode),
            );
          },
          audit,
        },
      );
      if (runtimeResponse) return runtimeResponse;
      const fakeResponse = await fakeRoute(request, context, {
        mode: runtimeConfig.mode,
        users,
        airtable,
        signingKey: config.sessionSigningKey,
        audit,
        invalidateCatalog: () => catalogCache.clear(),
      });
      if (fakeResponse) return fakeResponse;
      const credentials = new CredentialRepository(airtable, runtimeMode);
      const credentialResponse = await credentialsRoute(request, context, {
        users,
        credentials,
        deliveries: new DeliveryGrantRepository(airtable),
        idempotency: new IdempotencyRepository(airtable),
        signingKey: config.sessionSigningKey,
        deliveryPepper: config.deliveryPepper,
        audit,
        invalidateApplications: () => undefined,
      });
      if (credentialResponse) return credentialResponse;
      const applicationResponse = await applicationsRoute(request, context, {
        users,
        signingKey: config.sessionSigningKey,
        audit,
        corporate: {
          catalog: core.catalog,
          catalogCache,
          contexts: core.operationalContexts,
          credentials,
          realReferences: core.realReferences,
        },
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
    if (audit && /^\/v[12]\//u.test(url.pathname) && !context.auditRecorded) {
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
    return errorResponse(
      responseError,
      context.requestId,
      url.pathname.startsWith("/v2/") ? "2" : "1",
    );
  }
}

const catalogCache = new CatalogCache();
const authorizationReplayStore = new InMemoryAuthorizationReplayStore();
const runtimeModeCache = new RuntimeModeCache();

export default { fetch: handleRequest } satisfies ExportedHandler<WorkerEnv>;
