import type { z } from "zod";
import type {
  oidcDiscoverySchema,
  oidcJwksSchema,
  oidcTokenResponseSchema,
} from "./oidcSchemas";

export type OidcDiscovery = z.infer<typeof oidcDiscoverySchema>;
export type OidcTokenResponse = z.infer<typeof oidcTokenResponseSchema>;
export type OidcJwks = z.infer<typeof oidcJwksSchema>;

export interface OidcProviderPort {
  discovery(signal?: AbortSignal): Promise<OidcDiscovery>;
  exchangeCode(input: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
    signal?: AbortSignal;
  }): Promise<OidcTokenResponse>;
  jwks(uri: string, signal?: AbortSignal): Promise<OidcJwks>;
}
