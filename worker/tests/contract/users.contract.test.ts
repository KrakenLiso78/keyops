import { describe, expect, it } from "vitest";
import type { UserRepository } from "../../src/airtable/UserRepository";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import { noOpAuditSink } from "../../src/audit/AuditSink";
import { issueSessionToken } from "../../src/auth/sessionToken";
import { createRequestContext } from "../../src/http/requestContext";
import { usersRoute } from "../../src/routes/v1/users";
import { InMemoryAuthorizedUserStore } from "../support/InMemoryAuthorizedUserStore";

const signingKey = "authorized-users-contract-key-at-least-32-characters";
const administrator: AuthorizedUser = {
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

async function authenticatedRequest(url: string, init: RequestInit = {}) {
  const { token } = await issueSessionToken(administrator.id, signingKey);
  return new Request(url, {
    ...init,
    headers: { authorization: `Bearer ${token}`, ...init.headers },
  });
}

describe("authorized users contract", () => {
  it("lists and registers the same corporate identity without duplication", async () => {
    const store = new InMemoryAuthorizedUserStore([administrator]);
    const dependencies = {
      users: store as unknown as UserRepository,
      signingKey,
      audit: noOpAuditSink,
    };
    const listRequest = await authenticatedRequest(
      "https://keyops.example/v1/users",
    );
    const listed = await usersRoute(
      listRequest,
      createRequestContext(listRequest),
      dependencies,
    );
    expect(listed?.status).toBe(200);
    await expect(listed!.json()).resolves.toEqual([
      expect.objectContaining({
        id: administrator.id,
        profile: "administrator",
      }),
    ]);

    const command = {
      corporateIssuer: "https://identity.example.test",
      corporateSubject: "new-subject",
      profile: "analyst",
      enabled: true,
    };
    for (let index = 0; index < 2; index += 1) {
      const request = await authenticatedRequest(
        "https://keyops.example/v1/users",
        {
          method: "POST",
          body: JSON.stringify(command),
        },
      );
      const response = await usersRoute(
        request,
        createRequestContext(request),
        dependencies,
      );
      expect(response?.status).toBe(200);
      await expect(response!.json()).resolves.toMatchObject({
        corporateSubject: "new-subject",
        permissions: expect.arrayContaining(["applications:read"]),
      });
    }
    expect(
      store.users.filter(
        ({ corporateSubject }) => corporateSubject === "new-subject",
      ),
    ).toHaveLength(1);
  });

  it("requires If-Match and rejects stale updates", async () => {
    const target: AuthorizedUser = {
      ...administrator,
      id: "user-2",
      corporateSubject: "subject-2",
      profile: "analyst",
      permissions: ["applications:read"],
    };
    const store = new InMemoryAuthorizedUserStore([administrator, target]);
    const dependencies = {
      users: store as unknown as UserRepository,
      signingKey,
      audit: noOpAuditSink,
    };
    const missingVersion = await authenticatedRequest(
      "https://keyops.example/v1/users/user-2",
      {
        method: "PATCH",
        body: JSON.stringify({ profile: "auditor", enabled: true }),
      },
    );
    await expect(
      usersRoute(
        missingVersion,
        createRequestContext(missingVersion),
        dependencies,
      ),
    ).rejects.toMatchObject({ status: 428, code: "if_match_required" });

    const stale = await authenticatedRequest(
      "https://keyops.example/v1/users/user-2",
      {
        method: "PATCH",
        headers: { "if-match": '"stale-version"' },
        body: JSON.stringify({ profile: "auditor", enabled: true }),
      },
    );
    await expect(
      usersRoute(stale, createRequestContext(stale), dependencies),
    ).rejects.toMatchObject({ status: 409, code: "stale_user" });
  });
});
