import type { CredentialRepository } from "../airtable/CredentialRepository";
import type { DeliveryGrantRepository } from "../airtable/DeliveryGrantRepository";
import type { AuthorizedUser } from "../airtable/userSchema";
import { ApiError } from "../http/ApiError";
import {
  assertCredentialAction,
  nextCredentialState,
  type CredentialAction,
} from "./stateMachine";

type TransitionAction = Extract<
  CredentialAction,
  "suspend" | "reactivate" | "revoke"
>;

export interface TransitionCredentialInput {
  user: AuthorizedUser;
  environment: "test" | "production";
  applicationId: string;
  credentialId: string;
  action: TransitionAction;
  reason: string;
  operationId: string;
  now?: string;
  credentials: CredentialRepository;
  deliveries: DeliveryGrantRepository;
}

export async function transitionCredential(
  input: TransitionCredentialInput,
): Promise<Record<string, never>> {
  const now = input.now ?? new Date().toISOString();
  const application = await input.credentials.getApplication(
    input.environment,
    input.applicationId,
  );
  const aggregate = await input.credentials.findByIdForReconciliation(
    input.environment,
    input.applicationId,
    input.credentialId,
  );
  if (!aggregate) {
    throw new ApiError(
      404,
      "credential_not_found",
      "No se encontró la credencial solicitada.",
    );
  }
  const target = nextCredentialState(input.action);
  const alreadyApplied =
    aggregate.credential.fields.operationId === input.operationId &&
    aggregate.credential.fields.state === target;
  if (!alreadyApplied) {
    assertCredentialAction({
      user: input.user,
      action: input.action,
      state: aggregate.credential.fields.state,
      reason: input.reason,
    });
    const current = aggregate.versions.find(
      ({ fields }) =>
        fields.versionId === aggregate.credential.fields.currentVersionId,
    );
    if (!current) {
      throw new ApiError(
        503,
        "invalid_persisted_data",
        "La versión vigente no está disponible.",
      );
    }
    await input.credentials.updateVersions([
      {
        recordId: current.recordId,
        fields: {
          state: target,
          operationId: input.operationId,
          reason: input.reason.trim(),
          stateChangedAt: now,
        },
      },
    ]);
    await input.credentials.updateCredential(aggregate.credential.recordId, {
      state: target,
      operationId: input.operationId,
      lastChangedAt: now,
    });
  }
  await input.credentials.updateApplication(application.recordId, {
    currentCredentialId: input.credentialId,
    credentialState: target,
    lastChangedAt: now,
    updatedAt: now,
  });
  if (input.action === "revoke") {
    await input.deliveries.invalidateAvailable(
      aggregate.credential.fields.currentVersionId,
      now,
    );
  }
  const confirmed = await input.credentials.findById(
    input.environment,
    input.applicationId,
    input.credentialId,
  );
  if (confirmed?.credential.fields.state !== target) {
    throw new ApiError(
      503,
      "credential_reconciliation_failed",
      "No se pudo confirmar el nuevo estado.",
      true,
    );
  }
  return {};
}
