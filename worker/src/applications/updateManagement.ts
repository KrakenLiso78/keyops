import type { AuthorizedUser } from "../airtable/userSchema";
import type { ApplicationRepository } from "../airtable/ApplicationRepository";
import {
  managementCommandSchema,
  type ManagementCommand,
} from "../airtable/applicationSchema";
import { authorize } from "../auth/authorize";
import { ApiError } from "../http/ApiError";

export async function updateManagement(
  user: AuthorizedUser,
  repository: ApplicationRepository,
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
  return repository.updateManagement(
    input.environment,
    input.applicationId,
    input.expectedUpdatedAt,
    parsed.data as ManagementCommand,
  );
}
