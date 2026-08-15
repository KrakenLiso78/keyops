import { describe, expect, it } from "vitest";
import { OidcHttpAdapter } from "../../src/identity/OidcHttpAdapter";

describe("neutral OIDC HTTP adapter", () => {
  it("uses discovery, a confidential code exchange and JWKS without provider SDKs", async () => {
    const calls: Array<{
      url: string;
      method: string;
      headers: Headers;
      body?: string;
    }> = [];
    const fetcher: typeof fetch = async (input, init = {}) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      calls.push({
        url,
        method: init.method ?? "GET",
        headers: new Headers(init.headers),
        body: init.body?.toString(),
      });
      if (url.endsWith("/.well-known/openid-configuration")) {
        return Response.json({
          issuer: "https://identity.example.test",
          authorization_endpoint: "https://identity.example.test/authorize",
          token_endpoint: "https://identity.example.test/token",
          jwks_uri: "https://identity.example.test/jwks",
          code_challenge_methods_supported: ["S256"],
          id_token_signing_alg_values_supported: ["RS256"],
        });
      }
      if (url.endsWith("/token"))
        return Response.json({ id_token: "a".repeat(20) });
      return Response.json({
        keys: [
          {
            kty: "RSA",
            kid: "key-1",
            use: "sig",
            alg: "RS256",
            n: "n",
            e: "AQAB",
          },
        ],
      });
    };
    const adapter = new OidcHttpAdapter({
      issuer: "https://identity.example.test/",
      clientId: "keyops-test",
      clientSecret: "worker-only-secret",
      fetcher,
    });
    const discovery = await adapter.discovery();
    await adapter.exchangeCode({
      code: "authorization-code",
      codeVerifier: "pkce-verifier",
      redirectUri: "https://keyops.example/v1/auth/callback",
    });
    await adapter.jwks(discovery.jwks_uri);
    expect(calls.map(({ method }) => method)).toEqual([
      "GET",
      "GET",
      "POST",
      "GET",
    ]);
    expect(calls[2]!.headers.get("authorization")).toMatch(/^Basic /u);
    expect(calls[2]!.body).toContain("code_verifier=pkce-verifier");
    expect(calls[2]!.body).toContain(
      "redirect_uri=https%3A%2F%2Fkeyops.example",
    );
  });

  it("maps provider and invalid payload failures to controlled errors", async () => {
    const unavailable = new OidcHttpAdapter({
      issuer: "https://identity.example.test",
      clientId: "keyops-test",
      clientSecret: "worker-only-secret",
      fetcher: async () => Response.json({}, { status: 503 }),
    });
    await expect(unavailable.discovery()).rejects.toMatchObject({
      code: "identity_unavailable",
      retryable: true,
    });
    const invalid = new OidcHttpAdapter({
      issuer: "https://identity.example.test",
      clientId: "keyops-test",
      clientSecret: "worker-only-secret",
      fetcher: async () => Response.json({ issuer: "not-a-url" }),
    });
    await expect(invalid.discovery()).rejects.toMatchObject({
      code: "invalid_identity_data",
    });
  });
});
