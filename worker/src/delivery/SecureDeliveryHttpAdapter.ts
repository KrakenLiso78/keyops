import { containsForbiddenSecretKey } from "../credentials/real/redactRealCredential";
import { safeDeliveryReferenceSchema } from "../credentials/real/realCredentialSchemas";
import { ApiError } from "../http/ApiError";
import type {
  PrepareSecureDeliveryCommand,
  SafeDeliveryReference,
  SecureDeliveryPort,
} from "./SecureDeliveryPort";

export interface SecureDeliveryHttpOptions {
  baseUrl: string;
  token: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export class SecureDeliveryHttpAdapter implements SecureDeliveryPort {
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: SecureDeliveryHttpOptions) {
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  async prepare(
    command: PrepareSecureDeliveryCommand,
  ): Promise<SafeDeliveryReference> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(
        `${this.options.baseUrl.replace(/\/$/u, "")}/deliveries`,
        {
          method: "POST",
          signal: controller.signal,
          headers: {
            authorization: `Bearer ${this.options.token}`,
            accept: "application/json",
            "content-type": "application/json",
            "idempotency-key": command.operationId,
          },
          body: JSON.stringify(command),
        },
      );
      if (!response.ok) {
        throw new ApiError(
          503,
          "secure_delivery_unavailable",
          "El servicio de entrega protegida no está disponible.",
          true,
        );
      }
      const payload: unknown = await response.json();
      if (containsForbiddenSecretKey(payload)) {
        throw new ApiError(
          502,
          "secure_delivery_unsafe_response",
          "El servicio de entrega devolvió material no permitido.",
        );
      }
      return safeDeliveryReferenceSchema.parse(payload);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        503,
        "secure_delivery_unavailable",
        "El servicio de entrega protegida no está disponible.",
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
