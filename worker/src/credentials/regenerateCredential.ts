import type { CredentialRepository } from "../airtable/CredentialRepository";
import type { DeliveryGrantRepository } from "../airtable/DeliveryGrantRepository";
import type { AuthorizedUser } from "../airtable/userSchema";
import { ApiError } from "../http/ApiError";
import { ensureSyntheticDelivery } from "./issueCredential";
import type { FullDeliveryReceipt } from "./operationService";
import { assertCredentialAction } from "./stateMachine";

export interface RegenerateCredentialInput {
  user: AuthorizedUser;
  environment: "test" | "production";
  applicationId: string;
  credentialId: string;
  operationId: string;
  origin: string;
  now?: string;
  deliveryPepper: string;
  credentials: CredentialRepository;
  deliveries: DeliveryGrantRepository;
}

function versionId(operationId: string): string {
  return `version-${operationId.replace(/[^A-Za-z0-9_-]/gu, "-")}`;
}

export async function regenerateCredential(
  input: RegenerateCredentialInput,
): Promise<{ delivery: FullDeliveryReceipt }> {
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
      409,
      "credential_not_active",
      "No existe una credencial activa que pueda regenerarse.",
    );
  }
  assertCredentialAction({
    user: input.user,
    action: "regenerate",
    state: aggregate.credential.fields.state,
  });

  let nextVersion = await input.credentials.findVersionByOperation(
    input.operationId,
  );
  if (nextVersion && nextVersion.fields.credentialId !== input.credentialId) {
    throw new ApiError(
      409,
      "credential_operation_conflict",
      "La operación pertenece a otra credencial.",
    );
  }
  if (!nextVersion) {
    const current = aggregate.versions.find(
      ({ fields }) =>
        fields.versionId === aggregate.credential.fields.currentVersionId,
    );
    if (!current || current.fields.state !== "active") {
      throw new ApiError(
        409,
        "credential_invariant_violation",
        "La credencial no tiene una versión activa confirmada.",
      );
    }
    nextVersion = await input.credentials.createVersion({
      versionId: versionId(input.operationId),
      credentialId: input.credentialId,
      sequence:
        Math.max(...aggregate.versions.map(({ fields }) => fields.sequence)) +
        1,
      previousVersionId: current.fields.versionId,
      state: "pending",
      operationId: input.operationId,
      createdAt: now,
      stateChangedAt: now,
      schemaVersion: "1",
    });
  }

  if (nextVersion.fields.state === "pending") {
    const previous = aggregate.versions.find(
      ({ fields }) =>
        fields.versionId === nextVersion!.fields.previousVersionId,
    );
    if (!previous || previous.fields.state !== "active") {
      throw new ApiError(
        409,
        "credential_invariant_violation",
        "No se puede reconciliar la versión anterior.",
      );
    }
    const [updatedPrevious, updatedNext] =
      await input.credentials.updateVersions([
        {
          recordId: previous.recordId,
          fields: { state: "rotated_inactive", stateChangedAt: now },
        },
        {
          recordId: nextVersion.recordId,
          fields: { state: "active", stateChangedAt: now },
        },
      ]);
    if (
      updatedPrevious?.fields.state !== "rotated_inactive" ||
      updatedNext?.fields.state !== "active"
    ) {
      throw new ApiError(
        503,
        "provider_invalid_response",
        "No se pudo confirmar la rotación.",
        true,
      );
    }
    nextVersion = updatedNext;
  } else if (nextVersion.fields.state !== "active") {
    throw new ApiError(
      409,
      "credential_operation_conflict",
      "La versión de la operación no está activa.",
    );
  }

  await input.credentials.updateCredential(aggregate.credential.recordId, {
    currentVersionId: nextVersion.fields.versionId,
    state: "active",
    operationId: input.operationId,
    lastChangedAt: now,
  });
  await input.credentials.updateApplication(application.recordId, {
    currentCredentialId: input.credentialId,
    credentialState: "active",
    lastChangedAt: now,
    updatedAt: now,
  });
  const confirmed = await input.credentials.findById(
    input.environment,
    input.applicationId,
    input.credentialId,
  );
  if (
    !confirmed ||
    confirmed.versions.filter(({ fields }) => fields.state === "active")
      .length !== 1
  ) {
    throw new ApiError(
      503,
      "credential_reconciliation_failed",
      "No se pudo confirmar una única versión activa.",
      true,
    );
  }
  return {
    delivery: await ensureSyntheticDelivery({
      applicationId: input.applicationId,
      environment: input.environment,
      credentialVersionId: nextVersion.fields.versionId,
      operationId: input.operationId,
      origin: input.origin,
      now,
      deliveryPepper: input.deliveryPepper,
      deliveries: input.deliveries,
    }),
  };
}
