import { describe, expect, it } from "vitest";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { UserRepository } from "../../src/airtable/UserRepository";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import {
  registerAuthorizedUser,
  updateAuthorizedUser,
} from "../../src/users/authorizedUserService";

declare const process: { env: Record<string, string | undefined> };
const enabled = process.env.RUN_AIRTABLE_INTEGRATION === "1";

const actor: AuthorizedUser = {
  id: "integration-admin",
  loginIdentifier: "integration-admin",
  displayName: "Integration Admin",
  profile: "administrator",
  enabled: true,
  permissions: ["users:write"],
  updatedAt: "2026-08-15T10:00:00.000Z",
};

describe.skipIf(!enabled)("Airtable authorized users", () => {
  it("upserts one corporate identity and persists an optimistic update across clients", async () => {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_PAT;
    if (!baseId || !token)
      throw new Error("Faltan AIRTABLE_BASE_ID o AIRTABLE_PAT.");
    const first = new UserRepository(new AirtableClient({ baseId, token }));
    const command = {
      corporateIssuer: "https://identity.integration.invalid",
      corporateSubject: "keyops-integration-user",
      profile: "analyst" as const,
      enabled: true,
    };
    const registered = await registerAuthorizedUser(actor, first, command);
    await registerAuthorizedUser(actor, first, command);
    const second = new UserRepository(new AirtableClient({ baseId, token }));
    const reloaded = await second.findByCorporateIdentity(
      command.corporateIssuer,
      command.corporateSubject,
    );
    expect(reloaded?.id).toBe(registered.id);
    const matches = (await second.list()).filter(
      ({ corporateIssuer, corporateSubject }) =>
        corporateIssuer === command.corporateIssuer &&
        corporateSubject === command.corporateSubject,
    );
    expect(matches).toHaveLength(1);
    const updated = await updateAuthorizedUser(actor, second, {
      userId: registered.id,
      expectedUpdatedAt: reloaded!.updatedAt!,
      command: { profile: "auditor", enabled: false },
    });
    const third = new UserRepository(new AirtableClient({ baseId, token }));
    await expect(third.findById(updated.id)).resolves.toMatchObject({
      profile: "auditor",
      enabled: false,
      permissions: ["audit:read"],
    });
  });
});
