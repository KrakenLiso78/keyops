import { beforeEach, describe, expect, it } from "vitest";
import { validateIdToken } from "../../src/identity/oidcValidation";
import fixture from "../fixtures/identity/claims.json";
import { OidcProviderStub } from "../support/OidcProviderStub";

describe("OIDC ID token validation", () => {
  let provider: OidcProviderStub;
  const now = Date.parse("2026-08-15T10:00:00.000Z");

  beforeEach(() => {
    provider = new OidcProviderStub();
  });

  async function validate(
    overrides: Record<string, unknown> = {},
    redirect?: string,
  ) {
    const idToken = await provider.configureClaims({
      ...fixture,
      ...overrides,
    });
    return validateIdToken({
      idToken,
      jwks: await provider.jwks(),
      expectedIssuer: provider.issuer,
      expectedAudience: provider.clientId,
      expectedNonce: fixture.nonce,
      configuredRedirectUri: "https://keyops.example/v1/auth/callback",
      callbackRedirectUri:
        redirect ?? "https://keyops.example/v1/auth/callback",
      now,
    });
  }

  it("accepts a correctly signed token with exact issuer, audience and nonce", async () => {
    await expect(validate()).resolves.toMatchObject({ sub: fixture.sub });
  });

  it.each([
    ["issuer", { iss: "https://other.example" }],
    ["audience", { aud: "other-client" }],
    ["nonce", { nonce: "different-nonce-value" }],
    ["expiry", { exp: Math.floor(now / 1_000) - 1 }],
    ["active state", { active: false }],
  ])("rejects a wrong %s", async (_label, overrides) => {
    await expect(validate(overrides)).rejects.toMatchObject({ status: 401 });
  });

  it("rejects redirect mismatch and a modified signature", async () => {
    await expect(
      validate({}, "https://evil.example/callback"),
    ).rejects.toMatchObject({
      code: "invalid_redirect_uri",
    });
    const idToken = await provider.configureClaims(fixture);
    await expect(
      validateIdToken({
        idToken: `${idToken.slice(0, -2)}aa`,
        jwks: await provider.jwks(),
        expectedIssuer: provider.issuer,
        expectedAudience: provider.clientId,
        expectedNonce: fixture.nonce,
        configuredRedirectUri: "https://keyops.example/v1/auth/callback",
        callbackRedirectUri: "https://keyops.example/v1/auth/callback",
        now,
      }),
    ).rejects.toMatchObject({ code: "invalid_token_signature" });
  });
});
