import { describe, expect, it } from "vitest";
import {
  consumeAuthorizationTransaction,
  createAuthorizationTransaction,
  InMemoryAuthorizationReplayStore,
  normalizeReturnPath,
} from "../../src/auth/authorizationTransaction";

const secret = "authorization-transaction-secret-at-least-32-characters";

describe("OIDC authorization transaction", () => {
  it("creates state, nonce and a S256 challenge bound to an encrypted cookie", async () => {
    const transaction = await createAuthorizationTransaction(
      secret,
      "/audit",
      1_000,
    );
    expect(transaction.state).not.toBe(transaction.nonce);
    expect(transaction.verifier.length).toBeGreaterThan(40);
    expect(transaction.challenge).not.toContain("=");
    expect(transaction.cookie).toContain("HttpOnly; Secure; SameSite=Lax");
    const cookieValue = transaction.cookie.match(
      /keyops_oidc_tx=([^;]+)/u,
    )![1]!;
    const consumed = await consumeAuthorizationTransaction({
      cookieValue,
      suppliedState: transaction.state,
      secret,
      replayStore: new InMemoryAuthorizationReplayStore(),
      now: 2_000,
    });
    expect(consumed.returnPath).toBe("/audit");
    expect(consumed.nonce).toBe(transaction.nonce);
  });

  it("rejects wrong, expired and reused state", async () => {
    const transaction = await createAuthorizationTransaction(
      secret,
      undefined,
      1_000,
    );
    const cookieValue = transaction.cookie.match(
      /keyops_oidc_tx=([^;]+)/u,
    )![1]!;
    await expect(
      consumeAuthorizationTransaction({
        cookieValue,
        suppliedState: "wrong",
        secret,
        replayStore: new InMemoryAuthorizationReplayStore(),
        now: 2_000,
      }),
    ).rejects.toMatchObject({ code: "invalid_oidc_transaction" });
    await expect(
      consumeAuthorizationTransaction({
        cookieValue,
        suppliedState: transaction.state,
        secret,
        replayStore: new InMemoryAuthorizationReplayStore(),
        now: 601_001,
      }),
    ).rejects.toMatchObject({ code: "invalid_oidc_transaction" });
    const replayStore = new InMemoryAuthorizationReplayStore();
    await consumeAuthorizationTransaction({
      cookieValue,
      suppliedState: transaction.state,
      secret,
      replayStore,
      now: 2_000,
    });
    await expect(
      consumeAuthorizationTransaction({
        cookieValue,
        suppliedState: transaction.state,
        secret,
        replayStore,
        now: 3_000,
      }),
    ).rejects.toMatchObject({ code: "invalid_oidc_transaction" });
  });

  it("allows only application, audit and user return routes", () => {
    expect(normalizeReturnPath("/applications/app-1")).toBe(
      "/applications/app-1",
    );
    expect(() => normalizeReturnPath("https://evil.example")).toThrow();
    expect(() => normalizeReturnPath("//evil.example")).toThrow();
    expect(() => normalizeReturnPath("/sign-in")).toThrow();
  });
});
