import { describe, expect, it } from "vitest";
import {
  issueCorporateSession,
  verifyCorporateSession,
} from "../../src/auth/corporateSession";

const secret = "corporate-session-secret-at-least-32-characters";

describe("corporate session", () => {
  it("stores only a user reference and an identity hash for five minutes", async () => {
    const issued = await issueCorporateSession({
      userId: "user-1",
      issuer: "https://identity.example.test",
      subject: "corporate-subject-001",
      secret,
      now: 1_000,
    });
    expect(issued.cookie).toContain(
      "HttpOnly; Secure; SameSite=Lax; Max-Age=300",
    );
    expect(issued.cookie).not.toContain("corporate-subject-001");
    const value = issued.cookie.match(/keyops_session=([^;]+)/u)![1]!;
    await expect(
      verifyCorporateSession(value, secret, 300_999),
    ).resolves.toMatchObject({
      userId: "user-1",
      version: 1,
    });
    await expect(
      verifyCorporateSession(value, secret, 301_000),
    ).rejects.toMatchObject({
      code: "invalid_session",
    });
  });

  it("rejects tampered cookies", async () => {
    const issued = await issueCorporateSession({
      userId: "user-1",
      issuer: "https://identity.example.test",
      subject: "corporate-subject-001",
      secret,
    });
    const value = issued.cookie.match(/keyops_session=([^;]+)/u)![1]!;
    await expect(
      verifyCorporateSession(`${value}tampered`, secret),
    ).rejects.toMatchObject({
      code: "invalid_session",
    });
  });
});
