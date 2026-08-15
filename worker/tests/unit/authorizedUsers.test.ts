import { describe, expect, it } from "vitest";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import {
  registerAuthorizedUser,
  updateAuthorizedUser,
} from "../../src/users/authorizedUserService";
import { InMemoryAuthorizedUserStore } from "../support/InMemoryAuthorizedUserStore";

const admin: AuthorizedUser = {
  id: "admin-1",
  loginIdentifier: "admin-1",
  displayName: "Admin One",
  profile: "administrator",
  enabled: true,
  permissions: ["users:write"],
  corporateIssuer: "https://identity.example.test",
  corporateSubject: "admin-subject-1",
  updatedAt: "2026-08-15T10:00:00.000Z",
};

describe("authorized user service", () => {
  it("registers the same issuer and subject once with canonical permissions", async () => {
    const store = new InMemoryAuthorizedUserStore([admin]);
    const command = {
      corporateIssuer: "https://identity.example.test",
      corporateSubject: "new-subject",
      profile: "auditor" as const,
      enabled: true,
    };
    const first = await registerAuthorizedUser(
      admin,
      store,
      command,
      "2026-08-15T10:01:00.000Z",
    );
    const second = await registerAuthorizedUser(
      admin,
      store,
      command,
      "2026-08-15T10:02:00.000Z",
    );
    expect(first.id).toBe(second.id);
    expect(
      store.users.filter(
        ({ corporateSubject }) => corporateSubject === "new-subject",
      ),
    ).toHaveLength(1);
    expect(first.permissions).toEqual(["audit:read"]);
  });

  it("updates canonical permissions with optimistic concurrency", async () => {
    const target: AuthorizedUser = {
      ...admin,
      id: "user-2",
      corporateSubject: "subject-2",
      profile: "analyst",
      permissions: ["applications:read"],
    };
    const store = new InMemoryAuthorizedUserStore([admin, target]);
    const updated = await updateAuthorizedUser(admin, store, {
      userId: target.id,
      expectedUpdatedAt: target.updatedAt!,
      command: { profile: "auditor", enabled: false },
      now: "2026-08-15T10:05:00.000Z",
    });
    expect(updated).toMatchObject({
      profile: "auditor",
      enabled: false,
      permissions: ["audit:read"],
      updatedAt: "2026-08-15T10:05:00.000Z",
    });
    await expect(
      updateAuthorizedUser(admin, store, {
        userId: target.id,
        expectedUpdatedAt: target.updatedAt!,
        command: { profile: "analyst", enabled: true },
      }),
    ).rejects.toMatchObject({ code: "stale_user" });
  });
});
