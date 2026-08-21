import { z } from "zod";
import type { UserRepository } from "../../airtable/UserRepository";
import type { AuditSink } from "../../audit/AuditSink";
import { authenticate } from "../../auth/authenticate";
import { ApiError } from "../../http/ApiError";
import { completeOperation } from "../../http/completeOperation";
import {
  type RequestContext,
  withRequestActor,
} from "../../http/requestContext";
import type { RuntimeConfigurationRepository } from "../../runtime/RuntimeConfigurationRepository";

const commandSchema = z.object({ mode: z.enum(["fake", "real"]) }).strict();

export interface RuntimeConfigurationRouteDependencies {
  users: UserRepository;
  configuration: RuntimeConfigurationRepository;
  signingKey: string;
  readMode: () => Promise<"fake" | "real">;
  reloadMode: () => Promise<"fake" | "real">;
  audit: AuditSink;
}

export async function runtimeConfigurationRoute(
  request: Request,
  context: RequestContext,
  dependencies: RuntimeConfigurationRouteDependencies,
): Promise<Response | undefined> {
  const path = new URL(request.url).pathname;
  if (
    path !== "/v1/runtime-configuration" &&
    path !== "/v1/runtime-configuration/reload"
  ) {
    return undefined;
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
      "Solo un administrador puede cambiar el modo.",
    );
  }
  if (path === "/v1/runtime-configuration" && request.method === "GET") {
    return Response.json({ mode: await dependencies.readMode() });
  }
  if (path === "/v1/runtime-configuration" && request.method === "PUT") {
    const command = commandSchema.safeParse(
      await request.json().catch(() => undefined),
    );
    if (!command.success)
      throw new ApiError(400, "invalid_command", "El modo no es válido.");
    const completed = await completeOperation({
      audit: dependencies.audit,
      attempt: {
        actor,
        operation: "runtime.mode.update.v1",
        resourceType: "runtime_configuration",
        context,
      },
      execute: () => dependencies.configuration.save(command.data.mode),
    });
    return Response.json({ mode: completed.value });
  }
  if (
    path === "/v1/runtime-configuration/reload" &&
    request.method === "POST"
  ) {
    const completed = await completeOperation({
      audit: dependencies.audit,
      attempt: {
        actor,
        operation: "runtime.mode.reload.v1",
        resourceType: "runtime_configuration",
        context,
      },
      execute: dependencies.reloadMode,
    });
    return Response.json({ mode: completed.value });
  }
  throw new ApiError(405, "method_not_allowed", "El método no está permitido.");
}
