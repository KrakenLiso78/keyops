export type RealEnvironment = "test" | "production";
export type RealCredentialState = "active" | "suspended" | "revoked";
export type RealTransitionAction = "suspend" | "reactivate" | "revoke";

export interface RealProviderCommand {
  operationId: string;
  applicationId: string;
  environment: RealEnvironment;
}

export interface RotateProviderCommand extends RealProviderCommand {
  externalCredentialId: string;
}

export interface TransitionProviderCommand extends RotateProviderCommand {
  action: RealTransitionAction;
  reason: string;
}

export interface ProviderCredentialSnapshot {
  externalCredentialId: string;
  externalVersionId: string;
  previousExternalVersionId?: string;
  effectiveState: RealCredentialState;
  sealedDeliveryHandle?: string;
  confirmedAt: string;
}

export interface ProviderOperationResult {
  providerOperationId: string;
  status: "processing" | "confirmed" | "failed";
  failureCode?: string;
  credential?: ProviderCredentialSnapshot;
}

export interface AcceptanceProbe {
  externalCredentialId: string;
  externalVersionId: string;
  accepted: boolean;
  checkedAt: string;
}

export interface CredentialProviderPort {
  issue(command: RealProviderCommand): Promise<ProviderOperationResult>;
  rotate(command: RotateProviderCommand): Promise<ProviderOperationResult>;
  transition(
    command: TransitionProviderCommand,
  ): Promise<ProviderOperationResult>;
  status(providerOperationId: string): Promise<ProviderOperationResult>;
  probeAcceptance(
    externalCredentialId: string,
    externalVersionId: string,
  ): Promise<AcceptanceProbe>;
}
