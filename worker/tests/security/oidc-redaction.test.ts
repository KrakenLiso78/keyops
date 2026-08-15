import { describe, expect, it } from "vitest";
import { UserRepository } from "../../src/airtable/UserRepository";
import { AuditRecorder } from "../../src/audit/AuditRecorder";
import { InMemoryAuthorizationReplayStore } from "../../src/auth/authorizationTransaction";
import { createRequestContext } from "../../src/http/requestContext";
import { corporateAuthRoute } from "../../src/routes/v1/auth";
import { userFixtures } from "../fixtures/users";
import { InMemoryAuditRepository } from "../support/InMemoryAuditRepository";
import { OidcProviderStub } from "../support/OidcProviderStub";

describe("corporate identity redaction", () => {
  it("does not persist OIDC tokens, nonce or subject in audit evidence", async () => {
    const now = Date.parse("2026-08-15T10:00:00.000Z");
    const provider = new OidcProviderStub();
    const auditRepository = new InMemoryAuditRepository();
    const audit = new AuditRecorder(auditRepository, () =>
      new Date(now).toISOString(),
    );
    let user = { id: userFixtures[0]!.userId, ...userFixtures[0]! };
    const users = {
      async findByCorporateIdentity() {
        return user;
      },
      async markIdentityValidated(
        _id: string,
        input: { displayName?: string; identityValidatedAt: string },
      ) {
        user = {
          ...user,
          displayName: input.displayName ?? user.displayName,
          ...input,
        };
        return user;
      },
    } as unknown as UserRepository;
    const dependencies = {
      users,
      audit,
      signingKey: "redaction-signing-key-at-least-32-characters",
      oidc: provider,
      configuration: {
        issuer: provider.issuer,
        clientId: provider.clientId,
        redirectUri: "https://keyops.example/v1/auth/callback",
      },
      replayStore: new InMemoryAuthorizationReplayStore(),
      now: () => now,
    };
    const loginRequest = new Request("https://keyops.example/v1/auth/login");
    const login = (await corporateAuthRoute(
      loginRequest,
      createRequestContext(loginRequest),
      dependencies,
    ))!;
    const authorization = new URL(login.headers.get("location")!);
    const idToken = await provider.configureClaims({
      iss: provider.issuer,
      sub: "corporate-subject-001",
      aud: provider.clientId,
      nonce: authorization.searchParams.get("nonce"),
      iat: Math.floor(now / 1_000) - 10,
      exp: Math.floor(now / 1_000) + 300,
      name: "Corporate User",
    });
    const cookie = login.headers
      .get("set-cookie")!
      .match(/keyops_oidc_tx=([^;]+)/u)![1]!;
    const callbackRequest = new Request(
      `https://keyops.example/v1/auth/callback?code=secret-code&state=${authorization.searchParams.get("state")}`,
      { headers: { cookie: `keyops_oidc_tx=${cookie}` } },
    );
    await corporateAuthRoute(
      callbackRequest,
      createRequestContext(callbackRequest),
      dependencies,
    );
    const serialized = JSON.stringify(await auditRepository.list());
    expect(serialized).not.toContain(idToken);
    expect(serialized).not.toContain("secret-code");
    expect(serialized).not.toContain("corporate-subject-001");
    expect(serialized).not.toContain(authorization.searchParams.get("nonce"));
    expect(serialized).toContain("identity.callback.v1");
  });
});
