import { ApiError } from "../../http/ApiError";
import {
  acceptanceProbeSchema,
  providerOperationResultSchema,
} from "./realCredentialSchemas";
import { containsForbiddenSecretKey } from "./redactRealCredential";
import type {
  AcceptanceProbe,
  CredentialProviderPort,
  ProviderOperationResult,
  RealProviderCommand,
  RotateProviderCommand,
  TransitionProviderCommand,
} from "./CredentialProviderPort";

export interface CredentialProviderHttpOptions {
  baseUrl: string;
  token: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export class CredentialProviderHttpAdapter implements CredentialProviderPort {
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: CredentialProviderHttpOptions) {
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  issue(command: RealProviderCommand): Promise<ProviderOperationResult> {
    return this.operation("/operations/issue", command);
  }

  rotate(command: RotateProviderCommand): Promise<ProviderOperationResult> {
    return this.operation("/operations/rotate", command);
  }

  transition(
    command: TransitionProviderCommand,
  ): Promise<ProviderOperationResult> {
    return this.operation("/operations/transition", command);
  }

  status(providerOperationId: string): Promise<ProviderOperationResult> {
    return this.request(
      `/operations/${encodeURIComponent(providerOperationId)}`,
      { method: "GET" },
      providerOperationResultSchema.parse,
    );
  }

  probeAcceptance(
    externalCredentialId: string,
    externalVersionId: string,
  ): Promise<AcceptanceProbe> {
    return this.request(
      `/credentials/${encodeURIComponent(externalCredentialId)}/versions/${encodeURIComponent(externalVersionId)}/acceptance`,
      { method: "POST" },
      acceptanceProbeSchema.parse,
    );
  }

  private operation(
    path: string,
    command:
      RealProviderCommand | RotateProviderCommand | TransitionProviderCommand,
  ): Promise<ProviderOperationResult> {
    return this.request(
      path,
      {
        method: "POST",
        headers: { "idempotency-key": command.operationId },
        body: JSON.stringify(command),
      },
      providerOperationResultSchema.parse,
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    parse: (value: unknown) => T,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(
        `${this.options.baseUrl.replace(/\/$/u, "")}${path}`,
        {
          ...init,
          signal: controller.signal,
          headers: {
            authorization: `Bearer ${this.options.token}`,
            accept: "application/json",
            ...(init.body ? { "content-type": "application/json" } : {}),
            ...init.headers,
          },
        },
      );
      if (!response.ok) {
        if (response.status === 404) {
          throw new ApiError(
            404,
            "provider_operation_not_found",
            "El proveedor no reconoce la operación.",
          );
        }
        throw new ApiError(
          response.status === 409 ? 409 : 503,
          response.status === 409
            ? "credential_provider_conflict"
            : "credential_provider_unavailable",
          response.status === 409
            ? "El proveedor rechazó la operación por conflicto."
            : "El proveedor de credenciales no está disponible.",
          response.status !== 409,
        );
      }
      const payload: unknown = await response.json();
      if (containsForbiddenSecretKey(payload)) {
        throw new ApiError(
          502,
          "credential_provider_unsafe_response",
          "El proveedor devolvió material que no puede procesarse de forma segura.",
        );
      }
      return parse(payload);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        503,
        "credential_provider_unavailable",
        "El proveedor de credenciales no está disponible.",
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
