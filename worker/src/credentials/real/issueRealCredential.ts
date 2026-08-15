import { ApiError } from "../../http/ApiError";
import type {
  CredentialProviderPort,
  ProviderOperationResult,
  RealProviderCommand,
} from "./CredentialProviderPort";

export function issueRealCredential(input: {
  provider: CredentialProviderPort;
  command: RealProviderCommand;
  existingState?:
    "active" | "suspended" | "revoked" | "reconciliation_required";
}): Promise<ProviderOperationResult> {
  if (input.existingState && input.existingState !== "revoked") {
    throw new ApiError(
      409,
      "real_credential_already_exists",
      "La aplicación ya tiene una credencial real.",
    );
  }
  return input.provider.issue(input.command);
}
