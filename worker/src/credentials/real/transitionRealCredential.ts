import { ApiError } from "../../http/ApiError";
import type {
  CredentialProviderPort,
  ProviderOperationResult,
  TransitionProviderCommand,
} from "./CredentialProviderPort";

export function transitionRealCredential(input: {
  provider: CredentialProviderPort;
  command: TransitionProviderCommand;
  currentState: "active" | "suspended" | "revoked" | "reconciliation_required";
}): Promise<ProviderOperationResult> {
  if (!input.command.reason.trim()) {
    throw new ApiError(400, "reason_required", "El motivo es obligatorio.");
  }
  if (input.currentState === "revoked") {
    throw new ApiError(
      409,
      "revoked_credential_is_terminal",
      "Una credencial revocada no puede cambiar de estado.",
    );
  }
  if (
    (input.command.action === "suspend" && input.currentState !== "active") ||
    (input.command.action === "reactivate" &&
      input.currentState !== "suspended")
  ) {
    throw new ApiError(
      409,
      "invalid_real_credential_transition",
      "La transición no es válida para el estado actual.",
    );
  }
  return input.provider.transition(input.command);
}
