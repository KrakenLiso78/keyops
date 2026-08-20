import { describe, expect, it } from "vitest";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { UserRepository } from "../../src/airtable/UserRepository";
import type { UserFields } from "../../src/airtable/userSchema";
import { noOpAuditSink } from "../../src/audit/AuditSink";
import { issueSessionToken } from "../../src/auth/sessionToken";
import { createRequestContext } from "../../src/http/requestContext";
import { restoreSession } from "../../src/routes/v1/sessions";

declare const process: { env: Record<string, string | undefined> };

const enabled = process.env.RUN_AIRTABLE_INTEGRATION === "1";

describe.skipIf(!enabled)("Airtable persistent session authorization", () => {
  it("rejects an existing token after disabling its user from a fresh client", async () => {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_PAT;
    const signingKey = process.env.SESSION_SIGNING_KEY;
    if (!baseId || !token || !signingKey) {
      throw new Error(
        "Faltan AIRTABLE_BASE_ID, AIRTABLE_PAT o SESSION_SIGNING_KEY.",
      );
    }

    const client = new AirtableClient({ baseId, token });
    const records = await client.list<UserFields>("Users");
    const fixture = records.find(({ fields }) => fields.enabled);
    if (!fixture)
      throw new Error("No existe un usuario habilitado restaurable.");
    const original = structuredClone(fixture.fields);
    const session = await issueSessionToken(original.userId, signingKey);

    try {
      await client.update<UserFields>("Users", fixture.id, {
        enabled: false,
        updatedAt: new Date().toISOString(),
      });
      const freshUsers = new UserRepository(
        new AirtableClient({ baseId, token }),
      );
      const request = new Request("https://keyops.test/v1/session", {
        headers: { authorization: `Bearer ${session.token}` },
      });
      await expect(
        restoreSession(request, createRequestContext(request), {
          users: freshUsers,
          demoCredentials: {},
          signingKey,
          audit: noOpAuditSink,
        }),
      ).rejects.toMatchObject({ status: 401, code: "invalid_session" });
    } finally {
      await client.update<UserFields>("Users", fixture.id, original);
      const restored = await new UserRepository(
        new AirtableClient({ baseId, token }),
      ).findById(original.userId);
      expect(restored?.enabled).toBe(true);
    }
  });
});
