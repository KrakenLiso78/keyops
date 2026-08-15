import { describe, expect, it } from "vitest";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { UserRepository } from "../../src/airtable/UserRepository";
import { authorize } from "../../src/auth/authorize";
import {
  issueSessionToken,
  verifySessionToken,
} from "../../src/auth/sessionToken";
import { userFixtures } from "../fixtures/users";
import { InMemoryAirtable } from "../support/InMemoryAirtable";

const signingKey = "test-signing-key-with-at-least-32-characters";

describe("session and authorization", () => {
  it("issues and verifies an expiring signed token", async () => {
    const issued = await issueSessionToken(
      "user-analyst",
      signingKey,
      1_000,
      60,
    );
    await expect(
      verifySessionToken(issued.token, signingKey, 60_999),
    ).resolves.toMatchObject({
      sub: "user-analyst",
      v: 1,
    });
    await expect(
      verifySessionToken(issued.token, signingKey, 61_000),
    ).rejects.toMatchObject({
      code: "invalid_session",
    });
  });

  it("reloads users and denies missing permissions by default", async () => {
    const memory = new InMemoryAirtable(userFixtures);
    const users = new UserRepository(
      new AirtableClient({
        baseId: "app00000000000000",
        token: "test-token-value",
        fetcher: memory.fetch,
      }),
    );
    const analyst = await users.findById("user-analyst");
    expect(analyst?.enabled).toBe(true);
    expect(() => authorize(analyst!, "applications:read")).not.toThrow();
    expect(() => authorize(analyst!, "credentials:revoke")).toThrowError(
      expect.objectContaining({ status: 403, code: "forbidden" }),
    );
  });
});
