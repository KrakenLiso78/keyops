import type {
  OidcDiscovery,
  OidcJwks,
  OidcProviderPort,
  OidcTokenResponse,
} from "../../src/identity/OidcProviderPort";

function encode(value: Uint8Array | string) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

export class OidcProviderStub implements OidcProviderPort {
  readonly issuer = "https://identity.example.test";
  readonly clientId = "keyops-test";
  readonly kid = "keyops-test-key";
  readonly discoveryDocument: OidcDiscovery = {
    issuer: this.issuer,
    authorization_endpoint: `${this.issuer}/authorize`,
    token_endpoint: `${this.issuer}/token`,
    jwks_uri: `${this.issuer}/jwks`,
    code_challenge_methods_supported: ["S256"],
    id_token_signing_alg_values_supported: ["RS256"],
  };
  discoveryError?: Error;
  exchangeError?: Error;
  jwksError?: Error;
  exchangedCodes: Array<{
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }> = [];
  private keyPair?: CryptoKeyPair;
  private tokenResponse?: OidcTokenResponse;

  async configureClaims(claims: Record<string, unknown>) {
    this.keyPair ??= (await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"],
    )) as CryptoKeyPair;
    const header = encode(
      JSON.stringify({ alg: "RS256", kid: this.kid, typ: "JWT" }),
    );
    const payload = encode(JSON.stringify(claims));
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      this.keyPair.privateKey,
      new TextEncoder().encode(`${header}.${payload}`),
    );
    this.tokenResponse = {
      id_token: `${header}.${payload}.${encode(new Uint8Array(signature))}`,
    };
    return this.tokenResponse.id_token;
  }

  async discovery() {
    if (this.discoveryError) throw this.discoveryError;
    return structuredClone(this.discoveryDocument);
  }

  async exchangeCode(input: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }) {
    if (this.exchangeError) throw this.exchangeError;
    this.exchangedCodes.push(input);
    if (!this.tokenResponse)
      throw new Error("Configure claims before exchanging a code");
    return structuredClone(this.tokenResponse);
  }

  async jwks(): Promise<OidcJwks> {
    if (this.jwksError) throw this.jwksError;
    if (!this.keyPair)
      throw new Error("Configure claims before requesting JWKS");
    const publicJwk = await crypto.subtle.exportKey(
      "jwk",
      this.keyPair.publicKey,
    );
    return {
      keys: [
        {
          kty: "RSA",
          kid: this.kid,
          use: "sig",
          alg: "RS256",
          n: publicJwk.n!,
          e: publicJwk.e!,
        },
      ],
    };
  }
}
