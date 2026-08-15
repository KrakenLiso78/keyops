import type { AuthorizedUser, Permission } from "../airtable/userSchema";
import type { CredentialState } from "../airtable/credentialSchema";
import { ApiError } from "../http/ApiError";

export type CredentialAction =
  "issue" | "regenerate" | "deliver" | "suspend" | "reactivate" | "revoke";
export type CredentialDisplayState = "no_credentials" | CredentialState;

const permissions: Record<CredentialAction, Permission> = {
  issue: "credentials:issue",
  regenerate: "credentials:regenerate",
  deliver: "credentials:deliver",
  suspend: "credentials:suspend",
  reactivate: "credentials:reactivate",
  revoke: "credentials:revoke",
};

const transitions: Record<CredentialAction, readonly CredentialDisplayState[]> =
  {
    issue: ["no_credentials"],
    regenerate: ["active"],
    deliver: ["active"],
    suspend: ["active"],
    reactivate: ["suspended"],
    revoke: ["active", "suspended"],
  };

export function permissionForCredentialAction(
  action: CredentialAction,
): Permission {
  return permissions[action];
}

export function assertCredentialAction(input: {
  user: AuthorizedUser;
  action: CredentialAction;
  state: CredentialDisplayState;
  reason?: string;
}): void {
  if (
    !input.user.enabled ||
    !input.user.permissions.includes(permissions[input.action])
  ) {
    throw new ApiError(
      403,
      "forbidden",
      "No tienes permiso para realizar esta acción.",
    );
  }
  if (
    input.action === "revoke" &&
    !["senior_analyst", "administrator"].includes(input.user.profile)
  ) {
    throw new ApiError(
      403,
      "forbidden",
      "La revocación exige un perfil autorizado.",
    );
  }
  if (["suspend", "reactivate", "revoke"].includes(input.action)) {
    if (!input.reason?.trim()) {
      throw new ApiError(
        400,
        "reason_required",
        "Debes indicar el motivo de la operación.",
      );
    }
    if (input.reason.trim().length > 500) {
      throw new ApiError(
        400,
        "invalid_reason",
        "El motivo no puede superar 500 caracteres.",
      );
    }
  }
  if (!transitions[input.action].includes(input.state)) {
    throw new ApiError(
      409,
      "invalid_credential_transition",
      "La transición solicitada no está permitida.",
    );
  }
}

export function nextCredentialState(
  action: Extract<CredentialAction, "suspend" | "reactivate" | "revoke">,
): CredentialState {
  if (action === "suspend") return "suspended";
  if (action === "reactivate") return "active";
  return "revoked";
}
