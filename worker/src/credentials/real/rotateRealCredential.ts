import { ApiError } from "../../http/ApiError";
import type {
  CredentialProviderPort,
  ProviderOperationResult,
  RotateProviderCommand,
} from "./CredentialProviderPort";

export function rotateRealCredential(input: {
  provider: CredentialProviderPort;
  command: RotateProviderCommand;
  currentState: "active" | "suspended" | "revoked" | "reconciliation_required";
}): Promise<ProviderOperationResult> {
  if (input.currentState !== "active") {
    throw new ApiError(
      409,
      "real_credential_not_rotatable",
      "Solo una credencial real activa puede rotarse.",
    );
  }
  return input.provider.rotate(input.command);
}
