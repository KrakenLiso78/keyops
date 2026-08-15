import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplicationFields } from "../../src/airtable/applicationSchema";
import { handleRequest } from "../../src/index";
import { applicationRecords } from "../fixtures/applications";
import { userFixtures } from "../fixtures/users";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { createAirtableFetch } from "../support/createAirtableFetch";
import {
  applicationEnv,
  authorizationHeader,
} from "./applications-list.contract.test";

let store: InMemoryCredentialStore;

describe("POST /v1/applications/{id}/credentials", () => {
  beforeEach(() => {
    const application: ApplicationFields = {
      ...applicationRecords[0]!.fields,
      credentialState: "no_credentials",
      currentCredentialId: undefined,
    };
    store = new InMemoryCredentialStore({
      Users: userFixtures,
      Applications: [application],
      Credentials: [],
      CredentialVersions: [],
      DeliveryGrants: [],
      IdempotencyRecords: [],
    });
    vi.stubGlobal("fetch", createAirtableFetch(store));
  });

  it("returns one versioned receipt and replays it with the same key", async () => {
    const request = async () =>
      new Request(
        "https://keyops.test/v1/applications/app-test/credentials?environment=test",
        {
          method: "POST",
          headers: {
            ...(await authorizationHeader()),
            "idempotency-key": "issue-contract-key-0001",
          },
        },
      );
    const first = await handleRequest(await request(), applicationEnv);
    const replay = await handleRequest(await request(), applicationEnv);
    expect(first.status).toBe(200);
    expect(replay.status).toBe(200);
    const firstBody = (await first.json()) as Record<string, unknown>;
    const replayBody = (await replay.json()) as Record<string, unknown>;
    expect(firstBody).toMatchObject({
      contractVersion: "1",
      result: "succeeded",
      delivery: {
        deliveryId: expect.any(String),
        otp: expect.stringMatching(/^\d{6}$/u),
      },
    });
    expect(replayBody).toEqual(firstBody);
    expect(store.fields("Credentials")).toHaveLength(1);
    expect(store.fields("CredentialVersions")).toHaveLength(1);
  });

  it("requires authorization and a valid idempotency key", async () => {
    const missingSession = await handleRequest(
      new Request(
        "https://keyops.test/v1/applications/app-test/credentials?environment=test",
        {
          method: "POST",
          headers: { "idempotency-key": "issue-contract-key-0002" },
        },
      ),
      applicationEnv,
    );
    expect(missingSession.status).toBe(401);

    const missingKey = await handleRequest(
      new Request(
        "https://keyops.test/v1/applications/app-test/credentials?environment=test",
        { method: "POST", headers: await authorizationHeader() },
      ),
      applicationEnv,
    );
    expect(missingKey.status).toBe(400);
    await expect(missingKey.json()).resolves.toMatchObject({
      code: "invalid_idempotency_key",
    });
  });
});
