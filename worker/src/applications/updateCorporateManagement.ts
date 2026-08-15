import { managementCommandSchema } from "../airtable/applicationSchema";
import type { AuthorizedUser } from "../airtable/userSchema";
import { authorize } from "../auth/authorize";
import { ApiError } from "../http/ApiError";
import { getCorporateApplication } from "./getCorporateApplication";
import type { CorporateApplicationDependencies } from "./listCorporateApplications";

export async function updateCorporateManagement(
  user: AuthorizedUser,
  dependencies: CorporateApplicationDependencies,
  input: {
    environment: "test" | "production";
    applicationId: string;
    expectedUpdatedAt: string;
    command: unknown;
  },
) {
  authorize(user, "management:write");
  const parsed = managementCommandSchema.safeParse(input.command);
  if (!parsed.success) {
    throw new ApiError(
      400,
      "invalid_management",
      "El contexto de gestión no es válido.",
    );
  }
  const current = await getCorporateApplication(
    user,
    dependencies,
    input.environment,
    input.applicationId,
  );
  await dependencies.contexts.saveManagement({
    environment: input.environment,
    catalogApplicationId: input.applicationId,
    expectedUpdatedAt: input.expectedUpdatedAt,
    catalogUpdatedAt: current.updatedAt,
    technicalContact: parsed.data.technicalContact,
    reason: parsed.data.reason,
    requestOrTicketId: parsed.data.requestOrTicketId,
  });
  return getCorporateApplication(
    user,
    dependencies,
    input.environment,
    input.applicationId,
  );
}
