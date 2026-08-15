import { beforeEach, describe, expect, it, vi } from "vitest";
import { issueSessionToken } from "../../src/auth/sessionToken";
import type { ApplicationFields } from "../../src/airtable/applicationSchema";
import { handleRequest } from "../../src/index";
import { applicationRecords } from "../fixtures/applications";
import { activeCredential, activeVersion } from "../fixtures/credentials";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { createAirtableFetch } from "../support/createAirtableFetch";
import { applicationEnv } from "./applications-list.contract.test";

let store: InMemoryCredentialStore;

async function header(userId: string, key: string) {
  const { token } = await issueSessionToken(
    userId,
    applicationEnv.SESSION_SIGNING_KEY,
  );
  return { authorization: `Bearer ${token}`, "idempotency-key": key };
}

async function revoke(userId: string, key: string) {
  return handleRequest(
    new Request(
      `https://keyops.test/v1/applications/app-test/credentials/${activeCredential.credentialId}/transitions?environment=test`,
      {
        method: "POST",
        headers: {
          ...(await header(userId, key)),
          "content-type": "application/json",
        },
        body: JSON.stringify({ action: "revoke", reason: "Baja autorizada" }),
      },
    ),
    applicationEnv,
  );
}

describe("credential revocation contract", () => {
  beforeEach(() => {
    store = new InMemoryCredentialStore({
      Users: [
        {
          userId: "user-analyst",
          loginIdentifier: "analyst@example.invalid",
          displayName: "Analista",
          profile: "analyst",
          enabled: true,
          permissions: ["credentials:revoke"],
        },
        {
          userId: "user-senior",
          loginIdentifier: "senior@example.invalid",
          displayName: "Analista Senior",
          profile: "senior_analyst",
          enabled: true,
          permissions: ["credentials:revoke"],
        },
      ],
      Applications: [
        {
          ...applicationRecords[0]!.fields,
          credentialState: "active",
          currentCredentialId: activeCredential.credentialId,
        } satisfies ApplicationFields,
      ],
      Credentials: [activeCredential],
      CredentialVersions: [activeVersion],
      DeliveryGrants: [],
      IdempotencyRecords: [],
    });
    vi.stubGlobal("fetch", createAirtableFetch(store));
  });

  it("returns 403 for analyst, replays a senior result and rejects a second revocation", async () => {
    expect(
      (await revoke("user-analyst", "revoke-analyst-key-0001")).status,
    ).toBe(403);
    const first = await revoke("user-senior", "revoke-senior-key-0001");
    const replay = await revoke("user-senior", "revoke-senior-key-0001");
    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    expect(await replay.json()).toEqual(await first.json());
    const repeated = await revoke("user-senior", "revoke-senior-key-0002");
    expect(repeated.status).toBe(409);
  });
});
