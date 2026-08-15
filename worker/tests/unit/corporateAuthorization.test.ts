import { describe, expect, it } from "vitest";
import type { UserRepository } from "../../src/airtable/UserRepository";
import { authorizeCorporateIdentity } from "../../src/auth/authorize";
import { userFixtures } from "../fixtures/users";

function repository(user: (typeof userFixtures)[number] | undefined) {
  return {
    async findByCorporateIdentity() {
      return user ? { id: user.userId, ...user } : undefined;
    },
  } as unknown as UserRepository;
}

describe("corporate authorization", () => {
  it("authorizes an enabled identity by stable issuer and subject", async () => {
    await expect(
      authorizeCorporateIdentity(
        repository(userFixtures[0]),
        "https://identity.example.test",
        "corporate-subject-001",
      ),
    ).resolves.toMatchObject({ id: "user-analyst", enabled: true });
  });

  it.each([
    ["unknown", undefined],
    ["disabled", userFixtures[1]],
  ])(
    "denies %s identities with the same controlled result",
    async (_label, user) => {
      await expect(
        authorizeCorporateIdentity(
          repository(user),
          "https://identity.example.test",
          "corporate-subject",
        ),
      ).rejects.toMatchObject({
        status: 401,
        code: "corporate_access_denied",
      });
    },
  );
});
