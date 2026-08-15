import type {
  PersistedRealCredentialReference,
  PersistedRealOperationReceipt,
  RealCredentialReferenceRepository,
} from "../../airtable/RealCredentialReferenceRepository";
import type { AuthorizedUser } from "../../airtable/userSchema";
import type { AuditSink } from "../../audit/AuditSink";
import type {
  SafeDeliveryReference,
  SecureDeliveryPort,
} from "../../delivery/SecureDeliveryPort";
import { prepareSecureDelivery } from "../../delivery/prepareSecureDelivery";
import { ApiError } from "../../http/ApiError";
import type { RequestContext } from "../../http/requestContext";
import type {
  CredentialProviderPort,
  ProviderCredentialSnapshot,
  ProviderOperationResult,
  RealTransitionAction,
} from "./CredentialProviderPort";
import type {
  RealOperationReceipt,
  RealOperationReceiptFields,
} from "./realCredentialSchemas";
import {
  assertRealIdempotencyKey,
  realIdempotencyScopeHash,
  realRequestFingerprint,
} from "./realIdempotency";
import { issueRealCredential } from "./issueRealCredential";
import { rotateRealCredential } from "./rotateRealCredential";
import { transitionRealCredential } from "./transitionRealCredential";

export type RealCredentialAction = RealOperationReceiptFields["action"];

export interface RealCredentialCommand {
  action: RealCredentialAction;
  applicationId: string;
  credentialId?: string;
  environment: "test" | "production";
  idempotencyKey: string;
  reason?: string;
}

export interface RealOperationDependencies {
  provider: CredentialProviderPort;
  delivery: SecureDeliveryPort;
  references: RealCredentialReferenceRepository;
  audit: AuditSink;
  allowedEnvironments: ReadonlySet<"test" | "production">;
  now?: () => string;
  operationId?: () => string;
}

function expectedState(action: RealCredentialAction) {
  if (action === "suspend") return "suspended" as const;
  if (action === "revoke") return "revoked" as const;
  return "active" as const;
}

function auditOperation(action: RealCredentialAction): string {
  return `credential.${action}.v2`;
}

export class RealOperationService {
  private readonly now: () => string;
  private readonly nextOperationId: () => string;

  constructor(private readonly dependencies: RealOperationDependencies) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.nextOperationId =
      dependencies.operationId ?? (() => crypto.randomUUID());
  }

  async execute(input: {
    user: AuthorizedUser;
    command: RealCredentialCommand;
    context: RequestContext;
  }): Promise<RealOperationReceipt> {
    const { command } = input;
    this.assertEnvironment(command.environment);
    try {
      assertRealIdempotencyKey(command.idempotencyKey);
    } catch (error) {
      await this.auditError(input, error);
      throw error;
    }
    const [scopeHash, fingerprint] = await Promise.all([
      realIdempotencyScopeHash({
        userId: input.user.id,
        environment: command.environment,
        key: command.idempotencyKey,
      }),
      realRequestFingerprint({
        action: command.action,
        applicationId: command.applicationId,
        credentialId: command.credentialId,
        environment: command.environment,
        reason: command.reason?.trim(),
      }),
    ]);
    let reservation;
    try {
      reservation = await this.dependencies.references.reserveReceipt({
        operationId: this.nextOperationId(),
        idempotencyScopeHash: scopeHash,
        requestFingerprint: fingerprint,
        requestId: input.context.requestId,
        actorUserId: input.user.id,
        catalogApplicationId: command.applicationId,
        environment: command.environment,
        referenceId: command.credentialId,
        action: command.action,
        now: this.now(),
      });
    } catch (error) {
      await this.auditError(input, error);
      throw error;
    }

    if (
      !reservation.created &&
      reservation.receipt.fields.status === "confirmed"
    ) {
      return this.dependencies.references.toSafeReceipt(reservation.receipt);
    }

    let reference;
    try {
      reference = await this.referenceFor(command);
    } catch (error) {
      return this.recordFailure(input, reservation.receipt, error);
    }
    return reservation.created
      ? this.start(input, reservation.receipt, reference)
      : this.reconcile(input, reservation.receipt, reference);
  }

  async status(input: {
    user: AuthorizedUser;
    operationId: string;
    context: RequestContext;
  }): Promise<RealOperationReceipt> {
    const receipt = await this.dependencies.references.findReceiptByOperation(
      input.operationId,
    );
    if (!receipt) {
      throw new ApiError(
        404,
        "real_operation_not_found",
        "No se encontró la operación real solicitada.",
      );
    }
    if (
      receipt.fields.actorUserId !== input.user.id &&
      input.user.profile !== "administrator"
    ) {
      throw new ApiError(
        404,
        "real_operation_not_found",
        "No se encontró la operación real solicitada.",
      );
    }
    this.assertEnvironment(receipt.fields.environment);
    if (receipt.fields.status === "confirmed") {
      return this.dependencies.references.toSafeReceipt(receipt);
    }
    const reference = receipt.fields.referenceId
      ? await this.dependencies.references.findByReference(
          receipt.fields.environment,
          receipt.fields.catalogApplicationId,
          receipt.fields.referenceId,
        )
      : await this.dependencies.references.findByApplication(
          receipt.fields.environment,
          receipt.fields.catalogApplicationId,
        );
    return this.reconcile(
      {
        user: input.user,
        context: input.context,
        command: {
          action: receipt.fields.action,
          applicationId: receipt.fields.catalogApplicationId,
          credentialId: receipt.fields.referenceId,
          environment: receipt.fields.environment,
          idempotencyKey: "status-does-not-reserve",
        },
      },
      receipt,
      reference,
    );
  }

  private async start(
    input: OperationInput,
    receipt: PersistedRealOperationReceipt,
    reference?: PersistedRealCredentialReference,
  ): Promise<RealOperationReceipt> {
    try {
      const providerResult = await this.invokeProvider(
        input.command,
        receipt.fields.operationId,
        reference,
      );
      receipt = await this.dependencies.references.updateReceipt(receipt, {
        providerOperationId: providerResult.providerOperationId,
        updatedAt: this.now(),
      });
      return this.confirm(input, receipt, reference, providerResult);
    } catch (error) {
      return this.recordFailure(input, receipt, error);
    }
  }

  private async reconcile(
    input: OperationInput,
    receipt: PersistedRealOperationReceipt,
    reference?: PersistedRealCredentialReference,
  ): Promise<RealOperationReceipt> {
    try {
      const providerResult = await this.dependencies.provider.status(
        receipt.fields.providerOperationId,
      );
      return this.confirm(input, receipt, reference, providerResult);
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === "provider_operation_not_found"
      ) {
        try {
          const providerResult = await this.invokeProvider(
            input.command,
            receipt.fields.operationId,
            reference,
          );
          receipt = await this.dependencies.references.updateReceipt(receipt, {
            providerOperationId: providerResult.providerOperationId,
            updatedAt: this.now(),
          });
          return this.confirm(input, receipt, reference, providerResult);
        } catch (retryError) {
          return this.recordFailure(input, receipt, retryError);
        }
      }
      return this.recordFailure(input, receipt, error);
    }
  }

  private async confirm(
    input: OperationInput,
    receipt: PersistedRealOperationReceipt,
    reference: PersistedRealCredentialReference | undefined,
    providerResult: ProviderOperationResult,
  ): Promise<RealOperationReceipt> {
    if (providerResult.status === "processing") {
      return this.recordFailure(
        input,
        receipt,
        new ApiError(
          503,
          "provider_confirmation_pending",
          "La operación requiere reconciliación con el proveedor.",
          true,
        ),
      );
    }
    if (providerResult.status === "failed") {
      return this.recordFailure(
        input,
        receipt,
        new ApiError(
          409,
          providerResult.failureCode ?? "provider_operation_failed",
          "El proveedor rechazó la operación real.",
        ),
      );
    }
    if (!providerResult.credential) {
      return this.recordFailure(
        input,
        receipt,
        new ApiError(
          502,
          "provider_invalid_response",
          "El proveedor no confirmó el estado de la credencial.",
          true,
        ),
      );
    }

    try {
      await this.assertProviderInvariant(
        input.command.action,
        providerResult.credential,
      );
      const savedReference = await this.saveReference(
        input.command,
        receipt,
        reference,
        providerResult.credential,
      );
      const delivery = await this.prepareDelivery(
        input.command.action,
        receipt.fields.operationId,
        providerResult.credential,
      );
      const audit = await this.dependencies.audit.append({
        actor: input.user,
        operation: auditOperation(input.command.action),
        resourceType: "real_credential",
        resourceId: savedReference.fields.referenceId,
        applicationId: input.command.applicationId,
        credentialId: savedReference.fields.referenceId,
        environment: input.command.environment,
        operationId: receipt.fields.operationId,
        result: "succeeded",
        context: input.context,
      });
      const updated = await this.dependencies.references.updateReceipt(
        receipt,
        {
          providerOperationId: providerResult.providerOperationId,
          referenceId: savedReference.fields.referenceId,
          status: "confirmed",
          result: "succeeded",
          failureCode: undefined,
          deliveryReferenceId: delivery?.deliveryId,
          deliveryExpiresAt: delivery?.expiresAt,
          auditEventId: audit.auditEventId,
          confirmedAt: this.now(),
          updatedAt: this.now(),
        },
      );
      return this.dependencies.references.toSafeReceipt(updated);
    } catch (error) {
      return this.recordFailure(input, receipt, error);
    }
  }

  private async invokeProvider(
    command: RealCredentialCommand,
    operationId: string,
    reference?: PersistedRealCredentialReference,
  ): Promise<ProviderOperationResult> {
    const shared = {
      operationId,
      applicationId: command.applicationId,
      environment: command.environment,
    };
    if (command.action === "issue") {
      return issueRealCredential({
        provider: this.dependencies.provider,
        command: shared,
        existingState: reference?.fields.effectiveState,
      });
    }
    if (!reference || command.credentialId !== reference.fields.referenceId) {
      throw new ApiError(
        404,
        "real_credential_not_found",
        "No se encontró la credencial real solicitada.",
      );
    }
    if (command.action === "rotate") {
      return rotateRealCredential({
        provider: this.dependencies.provider,
        currentState: reference.fields.effectiveState,
        command: {
          ...shared,
          externalCredentialId: reference.fields.externalCredentialId,
        },
      });
    }
    return transitionRealCredential({
      provider: this.dependencies.provider,
      currentState: reference.fields.effectiveState,
      command: {
        ...shared,
        externalCredentialId: reference.fields.externalCredentialId,
        action: command.action as RealTransitionAction,
        reason: command.reason?.trim() ?? "",
      },
    });
  }

  private async assertProviderInvariant(
    action: RealCredentialAction,
    credential: ProviderCredentialSnapshot,
  ): Promise<void> {
    if (credential.effectiveState !== expectedState(action)) {
      throw new ApiError(
        503,
        "real_credential_state_mismatch",
        "El proveedor no confirmó el estado esperado.",
        true,
      );
    }
    const current = await this.dependencies.provider.probeAcceptance(
      credential.externalCredentialId,
      credential.externalVersionId,
    );
    if (current.accepted !== (credential.effectiveState === "active")) {
      throw new ApiError(
        503,
        "real_credential_acceptance_mismatch",
        "La aceptación efectiva no coincide con el estado confirmado.",
        true,
      );
    }
    if (action === "rotate" && credential.previousExternalVersionId) {
      const previous = await this.dependencies.provider.probeAcceptance(
        credential.externalCredentialId,
        credential.previousExternalVersionId,
      );
      if (previous.accepted) {
        throw new ApiError(
          503,
          "multiple_active_real_versions",
          "La versión anterior continúa activa después de la rotación.",
          true,
        );
      }
    }
  }

  private async saveReference(
    command: RealCredentialCommand,
    receipt: PersistedRealOperationReceipt,
    existing: PersistedRealCredentialReference | undefined,
    credential: ProviderCredentialSnapshot,
  ) {
    const referenceId =
      existing?.fields.referenceId ?? `real-${receipt.fields.operationId}`;
    return this.dependencies.references.saveReference({
      referenceId,
      externalCredentialId: credential.externalCredentialId,
      catalogApplicationId: command.applicationId,
      environment: command.environment,
      externalVersionId: credential.externalVersionId,
      effectiveState: credential.effectiveState,
      lastOperationId: receipt.fields.providerOperationId,
      lastConfirmedAt: credential.confirmedAt,
      updatedAt: this.now(),
      sealedDeliveryHandle: credential.sealedDeliveryHandle,
      schemaVersion: "2",
    });
  }

  private async prepareDelivery(
    action: RealCredentialAction,
    operationId: string,
    credential: ProviderCredentialSnapshot,
  ): Promise<SafeDeliveryReference | undefined> {
    if (action !== "issue" && action !== "rotate") return undefined;
    if (!credential.sealedDeliveryHandle) {
      throw new ApiError(
        502,
        "sealed_delivery_missing",
        "El proveedor no preparó el material para la entrega protegida.",
        true,
      );
    }
    return prepareSecureDelivery({
      delivery: this.dependencies.delivery,
      operationId,
      sealedDeliveryHandle: credential.sealedDeliveryHandle,
      now: () => new Date(this.now()).getTime(),
    });
  }

  private async recordFailure(
    input: OperationInput,
    receipt: PersistedRealOperationReceipt,
    error: unknown,
  ): Promise<RealOperationReceipt> {
    const controlled = controlledError(error);
    const result = controlled.status < 500 ? "rejected" : "failed";
    const status =
      controlled.status < 500 ? "confirmed" : "reconciliation_required";
    const audit = await this.dependencies.audit.append({
      actor: input.user,
      operation: auditOperation(input.command.action),
      resourceType: "real_credential",
      resourceId: input.command.credentialId ?? input.command.applicationId,
      applicationId: input.command.applicationId,
      credentialId: input.command.credentialId,
      environment: input.command.environment,
      operationId: receipt.fields.operationId,
      result,
      failureCode: controlled.code,
      context: input.context,
    });
    const updated = await this.dependencies.references.updateReceipt(receipt, {
      status,
      result,
      failureCode: controlled.code,
      auditEventId: audit.auditEventId,
      confirmedAt: status === "confirmed" ? this.now() : undefined,
      updatedAt: this.now(),
    });
    return this.dependencies.references.toSafeReceipt(updated);
  }

  private async auditError(
    input: OperationInput,
    error: unknown,
  ): Promise<void> {
    const controlled = controlledError(error);
    await this.dependencies.audit.append({
      actor: input.user,
      operation: auditOperation(input.command.action),
      resourceType: "real_credential",
      resourceId: input.command.credentialId ?? input.command.applicationId,
      applicationId: input.command.applicationId,
      credentialId: input.command.credentialId,
      environment: input.command.environment,
      result: controlled.status < 500 ? "rejected" : "failed",
      failureCode: controlled.code,
      context: input.context,
    });
  }

  private referenceFor(command: RealCredentialCommand) {
    return command.credentialId
      ? this.dependencies.references.findByReference(
          command.environment,
          command.applicationId,
          command.credentialId,
        )
      : this.dependencies.references.findByApplication(
          command.environment,
          command.applicationId,
        );
  }

  private assertEnvironment(environment: "test" | "production"): void {
    if (!this.dependencies.allowedEnvironments.has(environment)) {
      throw new ApiError(
        403,
        "real_environment_not_allowed",
        "Las operaciones reales no están habilitadas en este ambiente.",
      );
    }
  }
}

interface OperationInput {
  user: AuthorizedUser;
  command: RealCredentialCommand;
  context: RequestContext;
}

function controlledError(error: unknown): ApiError {
  return error instanceof ApiError
    ? error
    : new ApiError(
        500,
        "unexpected_error",
        "No se pudo confirmar la operación real.",
        true,
      );
}
