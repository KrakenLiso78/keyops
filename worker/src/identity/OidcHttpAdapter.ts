import { ApiError } from "../http/ApiError";
import type { OidcProviderPort } from "./OidcProviderPort";
import {
  oidcDiscoverySchema,
  oidcJwksSchema,
  oidcTokenResponseSchema,
} from "./oidcSchemas";

interface OidcHttpAdapterOptions {
  issuer: string;
  clientId: string;
  clientSecret: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export class OidcHttpAdapter implements OidcProviderPort {
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: OidcHttpAdapterOptions) {
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
  }

  async discovery(signal?: AbortSignal) {
    const issuer = this.options.issuer.replace(/\/$/u, "");
    const payload = await this.request(
      `${issuer}/.well-known/openid-configuration`,
      { method: "GET", signal },
    );
    return this.parse(oidcDiscoverySchema, payload);
  }

  async exchangeCode(input: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
    signal?: AbortSignal;
  }) {
    const discovery = await this.discovery(input.signal);
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      code_verifier: input.codeVerifier,
      redirect_uri: input.redirectUri,
      client_id: this.options.clientId,
    });
    const payload = await this.request(discovery.token_endpoint, {
      method: "POST",
      signal: input.signal,
      headers: {
        authorization: `Basic ${btoa(`${this.options.clientId}:${this.options.clientSecret}`)}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body,
    });
    return this.parse(oidcTokenResponseSchema, payload);
  }

  async jwks(uri: string, signal?: AbortSignal) {
    const payload = await this.request(uri, { method: "GET", signal });
    return this.parse(oidcJwksSchema, payload);
  }

  private async request(url: string, init: RequestInit): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const abort = () => controller.abort();
    init.signal?.addEventListener("abort", abort, { once: true });
    try {
      const response = await this.fetcher(url, {
        ...init,
        signal: controller.signal,
        headers: { accept: "application/json", ...init.headers },
      });
      if (!response.ok) {
        throw new ApiError(
          response.status >= 500 || response.status === 429 ? 503 : 401,
          response.status >= 500 || response.status === 429
            ? "identity_unavailable"
            : "identity_exchange_failed",
          response.status >= 500 || response.status === 429
            ? "El proveedor de identidad no está disponible."
            : "No se pudo validar la identidad corporativa.",
          response.status >= 500 || response.status === 429,
        );
      }
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        503,
        "identity_unavailable",
        "El proveedor de identidad no está disponible.",
        true,
      );
    } finally {
      clearTimeout(timeout);
      init.signal?.removeEventListener("abort", abort);
    }
  }

  private parse<T>(
    schema: { safeParse(value: unknown): { success: boolean; data?: T } },
    value: unknown,
  ): T {
    const parsed = schema.safeParse(value);
    if (!parsed.success || parsed.data === undefined) {
      throw new ApiError(
        503,
        "invalid_identity_data",
        "El proveedor de identidad devolvió datos no válidos.",
        true,
      );
    }
    return parsed.data;
  }
}
