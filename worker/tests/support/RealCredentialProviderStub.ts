import type {
  AcceptanceProbe,
  CredentialProviderPort,
  ProviderOperationResult,
  RealProviderCommand,
  RotateProviderCommand,
  TransitionProviderCommand,
} from "../../src/credentials/real/CredentialProviderPort";
import { ApiError } from "../../src/http/ApiError";

interface StubVersion {
  id: string;
  accepted: boolean;
}

interface StubCredential {
  id: string;
  applicationId: string;
  state: "active" | "suspended" | "revoked";
  versions: StubVersion[];
}

export class RealCredentialProviderStub implements CredentialProviderPort {
  readonly calls: Array<{ method: string; operationId?: string }> = [];
  private readonly operations = new Map<string, ProviderOperationResult>();
  private readonly credentials = new Map<string, StubCredential>();
  private loseResponse = false;
  private failBeforeEffect = false;

  loseNextResponse(): void {
    this.loseResponse = true;
  }

  failNextBeforeEffect(): void {
    this.failBeforeEffect = true;
  }

  issue(command: RealProviderCommand): Promise<ProviderOperationResult> {
    return this.apply(command.operationId, "issue", () => {
      const existing = [...this.credentials.values()].find(
        (credential) => credential.applicationId === command.applicationId,
      );
      if (existing && existing.state !== "revoked") {
        return failed(command.operationId, "credential_already_exists");
      }
      const credentialId = `external-${command.applicationId}`;
      const versionId = `version-${command.operationId}`;
      this.credentials.set(credentialId, {
        id: credentialId,
        applicationId: command.applicationId,
        state: "active",
        versions: [{ id: versionId, accepted: true }],
      });
      return confirmed(command.operationId, {
        externalCredentialId: credentialId,
        externalVersionId: versionId,
        effectiveState: "active",
        sealedDeliveryHandle: `sealed-${command.operationId}`,
      });
    });
  }

  rotate(command: RotateProviderCommand): Promise<ProviderOperationResult> {
    return this.apply(command.operationId, "rotate", () => {
      const credential = this.credentials.get(command.externalCredentialId);
      if (!credential || credential.state === "revoked") {
        return failed(command.operationId, "credential_not_rotatable");
      }
      const previous = credential.versions.find((version) => version.accepted);
      if (!previous)
        return failed(command.operationId, "active_version_missing");
      previous.accepted = false;
      const next = { id: `version-${command.operationId}`, accepted: true };
      credential.versions.push(next);
      credential.state = "active";
      return confirmed(command.operationId, {
        externalCredentialId: credential.id,
        externalVersionId: next.id,
        previousExternalVersionId: previous.id,
        effectiveState: "active",
        sealedDeliveryHandle: `sealed-${command.operationId}`,
      });
    });
  }

  transition(
    command: TransitionProviderCommand,
  ): Promise<ProviderOperationResult> {
    return this.apply(command.operationId, command.action, () => {
      const credential = this.credentials.get(command.externalCredentialId);
      const current = credential?.versions.at(-1);
      if (!credential || !current || credential.state === "revoked") {
        return failed(command.operationId, "invalid_transition");
      }
      if (command.action === "suspend") {
        credential.state = "suspended";
        current.accepted = false;
      } else if (command.action === "reactivate") {
        credential.state = "active";
        current.accepted = true;
      } else {
        credential.state = "revoked";
        current.accepted = false;
      }
      return confirmed(command.operationId, {
        externalCredentialId: credential.id,
        externalVersionId: current.id,
        effectiveState: credential.state,
      });
    });
  }

  async status(providerOperationId: string): Promise<ProviderOperationResult> {
    this.calls.push({ method: "status", operationId: providerOperationId });
    const result = this.operations.get(providerOperationId);
    if (!result) {
      throw new ApiError(
        404,
        "provider_operation_not_found",
        "Unknown provider operation.",
      );
    }
    return structuredClone(result);
  }

  async probeAcceptance(
    externalCredentialId: string,
    externalVersionId: string,
  ): Promise<AcceptanceProbe> {
    this.calls.push({ method: "probe" });
    const credential = this.credentials.get(externalCredentialId);
    const version = credential?.versions.find(
      (candidate) => candidate.id === externalVersionId,
    );
    if (!credential || !version) {
      throw new ApiError(404, "provider_version_not_found", "Unknown version.");
    }
    return {
      externalCredentialId,
      externalVersionId,
      accepted: version.accepted,
      checkedAt: "2026-08-15T12:00:00.000Z",
    };
  }

  activeVersions(externalCredentialId: string): number {
    return (
      this.credentials
        .get(externalCredentialId)
        ?.versions.filter((version) => version.accepted).length ?? 0
    );
  }

  private async apply(
    operationId: string,
    method: string,
    effect: () => ProviderOperationResult,
  ): Promise<ProviderOperationResult> {
    this.calls.push({ method, operationId });
    const replay = this.operations.get(operationId);
    if (replay) return structuredClone(replay);
    if (this.failBeforeEffect) {
      this.failBeforeEffect = false;
      throw new ApiError(
        503,
        "provider_unavailable",
        "Injected failure.",
        true,
      );
    }
    const result = effect();
    this.operations.set(operationId, result);
    if (this.loseResponse) {
      this.loseResponse = false;
      throw new ApiError(503, "provider_response_lost", "Injected loss.", true);
    }
    return structuredClone(result);
  }
}

function failed(
  operationId: string,
  failureCode: string,
): ProviderOperationResult {
  return {
    providerOperationId: operationId,
    status: "failed",
    failureCode,
  };
}

function confirmed(
  operationId: string,
  credential: Omit<
    NonNullable<ProviderOperationResult["credential"]>,
    "confirmedAt"
  >,
): ProviderOperationResult {
  return {
    providerOperationId: operationId,
    status: "confirmed",
    credential: {
      ...credential,
      confirmedAt: "2026-08-15T12:00:00.000Z",
    },
  };
}
