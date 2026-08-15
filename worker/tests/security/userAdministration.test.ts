import { describe, expect, it } from "vitest";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import { assertUserUpdateAllowed } from "../../src/users/userAdministrationPolicy";
import { AuditRecorder } from "../../src/audit/AuditRecorder";
import { issueSessionToken } from "../../src/auth/sessionToken";
import { createRequestContext } from "../../src/http/requestContext";
import { usersRoute } from "../../src/routes/v1/users";
import type { UserRepository } from "../../src/airtable/UserRepository";
import { InMemoryAuditRepository } from "../support/InMemoryAuditRepository";
import { InMemoryAuthorizedUserStore } from "../support/InMemoryAuthorizedUserStore";

const admin = (id: string): AuthorizedUser => ({
  id,
  loginIdentifier: id,
  displayName: id,
  profile: "administrator",
  enabled: true,
  permissions: ["users:write"],
  updatedAt: "2026-08-15T10:00:00.000Z",
});

describe("user administration policy", () => {
  it("denies actors without users:write", () => {
    const actor = {
      ...admin("analyst"),
      profile: "analyst" as const,
      permissions: [],
    };
    expect(() =>
      assertUserUpdateAllowed({
        actor,
        target: admin("target"),
        users: [actor, admin("target")],
        profile: "auditor",
        enabled: true,
      }),
    ).toThrowError(expect.objectContaining({ code: "forbidden" }));
  });

  it("prevents removing the last effective administrator", () => {
    const actor = admin("last-admin");
    expect(() =>
      assertUserUpdateAllowed({
        actor,
        target: actor,
        users: [actor],
        profile: "auditor",
        enabled: true,
      }),
    ).toThrowError(expect.objectContaining({ code: "last_administrator" }));
  });

  it("prevents self elevation or profile changes even with another administrator", () => {
    const actor = admin("admin-1");
    expect(() =>
      assertUserUpdateAllowed({
        actor,
        target: actor,
        users: [actor, admin("admin-2")],
        profile: "administrator",
        enabled: true,
      }),
    ).toThrowError(
      expect.objectContaining({ code: "self_administration_forbidden" }),
    );
  });

  it("audits registration without persisting corporate identity claims", async () => {
    const actor = {
      ...admin("admin-1"),
      corporateIssuer: "https://identity.example.test",
      corporateSubject: "admin-subject",
    };
    const store = new InMemoryAuthorizedUserStore([actor]);
    const events = new InMemoryAuditRepository();
    const signingKey = "user-audit-signing-key-at-least-32-characters";
    const { token } = await issueSessionToken(actor.id, signingKey);
    const request = new Request("https://keyops.example/v1/users", {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: JSON.stringify({
        corporateIssuer: "https://identity.sensitive.test",
        corporateSubject: "sensitive-subject",
        profile: "auditor",
        enabled: true,
      }),
    });
    const response = await usersRoute(request, createRequestContext(request), {
      users: store as unknown as UserRepository,
      signingKey,
      audit: new AuditRecorder(events),
    });
    expect(response?.status).toBe(200);
    const serialized = JSON.stringify(await events.list());
    expect(serialized).toContain("user.register.v1");
    expect(serialized).not.toContain("identity.sensitive.test");
    expect(serialized).not.toContain("sensitive-subject");
  });
});
