import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplicationFields } from "../../src/airtable/applicationSchema";
import type { CredentialFields } from "../../src/airtable/credentialSchema";
import { handleRequest } from "../../src/index";
import { applicationRecords } from "../fixtures/applications";
import { userFixtures } from "../fixtures/users";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { createAirtableFetch } from "../support/createAirtableFetch";
import { applicationEnv, authorizationHeader } from "../support/contractEnv";

let store: InMemoryCredentialStore;

async function post(path: string, key: string) {
  return handleRequest(
    new Request(`https://keyops.test${path}`, {
      method: "POST",
      headers: { ...(await authorizationHeader()), "idempotency-key": key },
    }),
    applicationEnv,
  );
}

describe("POST credential regeneration", () => {
  beforeEach(() => {
    const application: ApplicationFields = {
      ...applicationRecords[0]!.fields,
      credentialState: "no_credentials",
      currentCredentialId: undefined,
    };
    store = new InMemoryCredentialStore({
      Users: [
        {
          ...userFixtures[0]!,
          permissions: ["credentials:issue", "credentials:regenerate"],
        },
      ],
      Applications: [application],
      Credentials: [],
      CredentialVersions: [],
      DeliveryGrants: [],
      IdempotencyRecords: [],
    });
    vi.stubGlobal("fetch", createAirtableFetch(store));
  });

  it("rotates with a new key and rejects reuse of an issue key", async () => {
    const issueKey = "shared-contract-key-0001";
    expect(
      (
        await post(
          "/v1/applications/app-test/credentials?environment=test",
          issueKey,
        )
      ).status,
    ).toBe(200);
    const credentialId =
      store.fields<CredentialFields>("Credentials")[0]!.credentialId;
    const path = `/v1/applications/app-test/credentials/${credentialId}/regenerations?environment=test`;
    const conflict = await post(path, issueKey);
    expect(conflict.status).toBe(409);
    await expect(conflict.json()).resolves.toMatchObject({
      code: "idempotency_conflict",
    });

    const regenerated = await post(path, "regeneration-key-0001");
    expect(regenerated.status).toBe(200);
    await expect(regenerated.json()).resolves.toMatchObject({
      contractVersion: "1",
      result: "succeeded",
      delivery: { otp: expect.stringMatching(/^\d{6}$/u) },
    });
  });
});
