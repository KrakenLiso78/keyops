import { describe, expect, it } from "vitest";
import type { UserRepository } from "../../src/airtable/UserRepository";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import { InMemoryAuthorizationReplayStore } from "../../src/auth/authorizationTransaction";
import { noOpAuditSink } from "../../src/audit/AuditSink";
import { createRequestContext } from "../../src/http/requestContext";
import { corporateAuthRoute } from "../../src/routes/v1/auth";
import { restoreSession } from "../../src/routes/v1/sessions";
import { userFixtures } from "../fixtures/users";
import { OidcProviderStub } from "../support/OidcProviderStub";

const signingKey = "corporate-contract-signing-key-at-least-32-characters";
const redirectUri = "https://keyops.example/v1/auth/callback";
const now = Date.now();

function memoryUsers() {
  let user: AuthorizedUser = {
    id: userFixtures[0]!.userId,
    ...userFixtures[0]!,
  };
  return {
    repository: {
      async findByCorporateIdentity(issuer: string, subject: string) {
        return user.corporateIssuer === issuer &&
          user.corporateSubject === subject
          ? user
          : undefined;
      },
      async markIdentityValidated(
        _userId: string,
        input: { displayName?: string; identityValidatedAt: string },
      ) {
        user = {
          ...user,
          displayName: input.displayName ?? user.displayName,
          identityValidatedAt: input.identityValidatedAt,
        };
        return user;
      },
      async findById(userId: string) {
        return user.id === userId ? user : undefined;
      },
    } as unknown as UserRepository,
    current: () => user,
  };
}

describe("corporate authentication contract", () => {
  it("redirects with PKCE, completes callback and restores the cookie session", async () => {
    const provider = new OidcProviderStub();
    const users = memoryUsers();
    const dependencies = {
      users: users.repository,
      audit: noOpAuditSink,
      signingKey,
      oidc: provider,
      configuration: {
        issuer: provider.issuer,
        clientId: provider.clientId,
        redirectUri,
      },
      replayStore: new InMemoryAuthorizationReplayStore(),
      now: () => now,
    };
    const loginRequest = new Request(
      "https://keyops.example/v1/auth/login?returnPath=%2Fapplications",
    );
    const login = await corporateAuthRoute(
      loginRequest,
      createRequestContext(loginRequest),
      dependencies,
    );
    expect(login?.status).toBe(302);
    const authorization = new URL(login!.headers.get("location")!);
    expect(authorization.searchParams.get("code_challenge_method")).toBe(
      "S256",
    );
    expect(authorization.searchParams.get("redirect_uri")).toBe(redirectUri);
    expect(authorization.searchParams.get("state")).toBeTruthy();
    expect(authorization.searchParams.get("nonce")).toBeTruthy();

    await provider.configureClaims({
      iss: provider.issuer,
      sub: "corporate-subject-001",
      aud: provider.clientId,
      nonce: authorization.searchParams.get("nonce"),
      iat: Math.floor(now / 1_000) - 10,
      exp: Math.floor(now / 1_000) + 300,
      name: "Nombre corporativo actualizado",
      active: true,
    });
    const transactionCookie = login!.headers
      .get("set-cookie")!
      .match(/keyops_oidc_tx=([^;]+)/u)![1]!;
    const callbackRequest = new Request(
      `${redirectUri}?code=valid-code&state=${authorization.searchParams.get("state")}`,
      { headers: { cookie: `keyops_oidc_tx=${transactionCookie}` } },
    );
    const callback = await corporateAuthRoute(
      callbackRequest,
      createRequestContext(callbackRequest),
      dependencies,
    );
    expect(callback?.status).toBe(302);
    expect(callback?.headers.get("location")).toBe("/applications");
    expect(users.current()).toMatchObject({
      displayName: "Nombre corporativo actualizado",
      identityValidatedAt: new Date(now).toISOString(),
    });
    const sessionCookie = callback!.headers
      .get("set-cookie")!
      .match(/keyops_session=([^;,]+)/u)![1]!;
    const restoreRequest = new Request("https://keyops.example/v1/session", {
      headers: { cookie: `keyops_session=${sessionCookie}` },
    });
    const restored = await restoreSession(
      restoreRequest,
      createRequestContext(restoreRequest),
      {
        users: users.repository,
        demoCredentials: {},
        signingKey,
        audit: noOpAuditSink,
      },
    );
    await expect(restored.json()).resolves.toMatchObject({
      contractVersion: "1",
      user: {
        id: "user-analyst",
        displayName: "Nombre corporativo actualizado",
      },
    });
  });

  it("rejects a reused callback transaction", async () => {
    const provider = new OidcProviderStub();
    const users = memoryUsers();
    const dependencies = {
      users: users.repository,
      audit: noOpAuditSink,
      signingKey,
      oidc: provider,
      configuration: {
        issuer: provider.issuer,
        clientId: provider.clientId,
        redirectUri,
      },
      replayStore: new InMemoryAuthorizationReplayStore(),
      now: () => now,
    };
    const request = new Request("https://keyops.example/v1/auth/login");
    const login = (await corporateAuthRoute(
      request,
      createRequestContext(request),
      dependencies,
    ))!;
    const authorization = new URL(login.headers.get("location")!);
    await provider.configureClaims({
      iss: provider.issuer,
      sub: "corporate-subject-001",
      aud: provider.clientId,
      nonce: authorization.searchParams.get("nonce"),
      iat: Math.floor(now / 1_000) - 10,
      exp: Math.floor(now / 1_000) + 300,
    });
    const cookie = login.headers
      .get("set-cookie")!
      .match(/keyops_oidc_tx=([^;]+)/u)![1]!;
    const callback = () => {
      const callbackRequest = new Request(
        `${redirectUri}?code=valid-code&state=${authorization.searchParams.get("state")}`,
        { headers: { cookie: `keyops_oidc_tx=${cookie}` } },
      );
      return corporateAuthRoute(
        callbackRequest,
        createRequestContext(callbackRequest),
        dependencies,
      );
    };
    await expect(callback()).resolves.toMatchObject({ status: 302 });
    await expect(callback()).rejects.toMatchObject({
      code: "invalid_oidc_transaction",
    });
  });
});
