import type { CredentialRepository } from "../airtable/CredentialRepository";
import type { DeliveryGrantRepository } from "../airtable/DeliveryGrantRepository";
import type { AuthorizedUser } from "../airtable/userSchema";
import { ApiError } from "../http/ApiError";
import type { FullDeliveryReceipt } from "./operationService";
import { assertCredentialAction } from "./stateMachine";
import {
  DELIVERY_TTL_MS,
  deliveryCodeDigest,
  deriveOneTimeCode,
  syntheticClientId,
} from "./syntheticDelivery";

export interface IssueCredentialInput {
  user: AuthorizedUser;
  environment: "test" | "production";
  applicationId: string;
  operationId: string;
  origin: string;
  now?: string;
  deliveryPepper: string;
  credentials: CredentialRepository;
  deliveries: DeliveryGrantRepository;
}

function businessId(prefix: string, operationId: string): string {
  return `${prefix}-${operationId.replace(/[^A-Za-z0-9_-]/gu, "-")}`;
}

export async function ensureSyntheticDelivery(input: {
  applicationId: string;
  environment: "test" | "production";
  credentialVersionId: string;
  operationId: string;
  origin: string;
  now: string;
  deliveryPepper: string;
  deliveries: DeliveryGrantRepository;
}): Promise<FullDeliveryReceipt> {
  const deliveryId = businessId("delivery", input.operationId);
  const otp = await deriveOneTimeCode(input.deliveryPepper, deliveryId);
  const existing = await input.deliveries.find(deliveryId);
  if (existing) {
    if (
      existing.fields.operationId !== input.operationId ||
      existing.fields.credentialVersionId !== input.credentialVersionId
    ) {
      throw new ApiError(
        409,
        "delivery_operation_conflict",
        "La entrega no coincide con la operación solicitada.",
      );
    }
    return {
      deliveryId,
      credentialVersionId: input.credentialVersionId,
      deliveryUrl: new URL(
        `/v1/deliveries/${encodeURIComponent(deliveryId)}/artifact`,
        input.origin,
      ).toString(),
      otp,
      otpExpiresAt: existing.fields.expiresAt,
      createdAt: existing.fields.createdAt,
    };
  }
  const expiresAt = new Date(
    new Date(input.now).getTime() + DELIVERY_TTL_MS,
  ).toISOString();
  await input.deliveries.create({
    deliveryId,
    credentialVersionId: input.credentialVersionId,
    applicationId: input.applicationId,
    environment: input.environment,
    codeDigest: await deliveryCodeDigest(input.deliveryPepper, deliveryId, otp),
    expiresAt,
    operationId: input.operationId,
    createdAt: input.now,
    schemaVersion: "1",
  });
  return {
    deliveryId,
    credentialVersionId: input.credentialVersionId,
    deliveryUrl: new URL(
      `/v1/deliveries/${encodeURIComponent(deliveryId)}/artifact`,
      input.origin,
    ).toString(),
    otp,
    otpExpiresAt: expiresAt,
    createdAt: input.now,
  };
}

export async function issueCredential(
  input: IssueCredentialInput,
): Promise<{ delivery: FullDeliveryReceipt }> {
  const now = input.now ?? new Date().toISOString();
  const application = await input.credentials.getApplication(
    input.environment,
    input.applicationId,
  );
  const existing = await input.credentials.findByApplication(
    input.environment,
    input.applicationId,
  );
  if (
    existing &&
    existing.credential.fields.operationId !== input.operationId
  ) {
    assertCredentialAction({
      user: input.user,
      action: "issue",
      state: existing.credential.fields.state,
    });
  }
  if (!existing) {
    assertCredentialAction({
      user: input.user,
      action: "issue",
      state: "no_credentials",
    });
    if (application.fields.credentialState !== "no_credentials") {
      throw new ApiError(
        409,
        "credential_state_mismatch",
        "El inventario indica que la aplicación ya tiene credenciales.",
      );
    }
  }

  const credentialId =
    existing?.credential.fields.credentialId ??
    businessId("credential", input.operationId);
  const versionId =
    existing?.credential.fields.currentVersionId ??
    businessId("version", input.operationId);
  let version = await input.credentials.findVersionByOperation(
    input.operationId,
  );
  if (!version) {
    version = await input.credentials.createVersion({
      versionId,
      credentialId,
      sequence: 1,
      state: "active",
      operationId: input.operationId,
      createdAt: now,
      stateChangedAt: now,
      schemaVersion: "1",
    });
  }
  if (
    version.fields.versionId !== versionId ||
    version.fields.credentialId !== credentialId
  ) {
    throw new ApiError(
      409,
      "credential_operation_conflict",
      "La operación no coincide con la credencial esperada.",
    );
  }

  if (!existing) {
    await input.credentials.createCredential({
      credentialId,
      applicationId: input.applicationId,
      environment: input.environment,
      syntheticClientId: syntheticClientId(
        input.environment,
        input.applicationId,
        credentialId,
      ),
      currentVersionId: versionId,
      state: "active",
      operationId: input.operationId,
      lastChangedAt: now,
      schemaVersion: "1",
    });
  }
  await input.credentials.updateApplication(application.recordId, {
    currentCredentialId: credentialId,
    credentialState: "active",
    lastChangedAt: now,
    updatedAt: now,
  });
  return {
    delivery: await ensureSyntheticDelivery({
      applicationId: input.applicationId,
      environment: input.environment,
      credentialVersionId: versionId,
      operationId: input.operationId,
      origin: input.origin,
      now,
      deliveryPepper: input.deliveryPepper,
      deliveries: input.deliveries,
    }),
  };
}
