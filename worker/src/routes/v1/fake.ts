import type { AirtableClient } from "../../airtable/AirtableClient";
import type { UserRepository } from "../../airtable/UserRepository";
import type { AuditSink } from "../../audit/AuditSink";
import { authenticate } from "../../auth/authenticate";
import { resetDemoData } from "../../fake/resetDemoData";
import { ApiError } from "../../http/ApiError";
import { completeOperation } from "../../http/completeOperation";
import {
  type RequestContext,
  withRequestActor,
} from "../../http/requestContext";

export interface FakeRouteDependencies {
  mode: "fake" | "real";
  users: UserRepository;
  airtable: AirtableClient;
  signingKey: string;
  audit: AuditSink;
  invalidateCatalog: () => void;
}

export async function fakeRoute(
  request: Request,
  context: RequestContext,
  dependencies: FakeRouteDependencies,
): Promise<Response | undefined> {
  if (new URL(request.url).pathname !== "/v1/fake/reset") return undefined;
  if (request.method !== "POST") {
    throw new ApiError(
      405,
      "method_not_allowed",
      "El método no está permitido.",
    );
  }
  if (dependencies.mode !== "fake") {
    throw new ApiError(
      404,
      "not_found",
      "No se encontró el recurso solicitado.",
    );
  }
  const actor = await authenticate(
    request,
    dependencies.users,
    dependencies.signingKey,
  );
  withRequestActor(context, actor);
  if (actor.profile !== "administrator") {
    throw new ApiError(
      403,
      "forbidden",
      "Solo un administrador puede restaurar la demostración.",
    );
  }
  const completed = await completeOperation({
    audit: dependencies.audit,
    attempt: {
      actor,
      operation: "fake.reset.v1",
      resourceType: "demo_dataset",
      context,
    },
    execute: async () => {
      const result = await resetDemoData(dependencies.airtable);
      dependencies.invalidateCatalog();
      return result;
    },
  });
  return Response.json(
    { contractVersion: "1", tables: completed.value },
    {
      headers: {
        "cache-control": "no-store",
        "x-request-id": context.requestId,
      },
    },
  );
}
