import { beforeEach, describe, expect, it, vi } from "vitest";
import { issueSessionToken } from "../../src/auth/sessionToken";
import type { ApplicationFields } from "../../src/airtable/applicationSchema";
import { handleRequest } from "../../src/index";
import { applicationRecords } from "../fixtures/applications";
import { activeCredential, activeVersion } from "../fixtures/credentials";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { createAirtableFetch } from "../support/createAirtableFetch";
import { applicationEnv } from "../support/contractEnv";

let store: InMemoryCredentialStore;

async function create(key: string) {
  const { token } = await issueSessionToken(
    "user-analyst",
    applicationEnv.SESSION_SIGNING_KEY,
  );
  return handleRequest(
    new Request(
      `https://keyops.test/v1/applications/app-test/credentials/${activeCredential.credentialId}/deliveries?environment=test`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "idempotency-key": key,
        },
      },
    ),
    applicationEnv,
  );
}

async function consume(deliveryId: string, code: string) {
  return handleRequest(
    new Request(
      `https://keyops.test/v1/deliveries/${encodeURIComponent(deliveryId)}/artifact`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      },
    ),
    applicationEnv,
  );
}

describe("synthetic delivery contract", () => {
  beforeEach(() => {
    store = new InMemoryCredentialStore({
      Users: [
        {
          userId: "user-analyst",
          loginIdentifier: "analyst@example.invalid",
          displayName: "Analista",
          profile: "analyst",
          enabled: true,
          permissions: ["credentials:deliver"],
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

  it("creates a new one-use delivery and makes the previous code unavailable", async () => {
    const first = await create("delivery-key-00000001");
    const firstBody = (await first.json()) as {
      delivery: { deliveryId: string; otp: string };
    };
    const second = await create("delivery-key-00000002");
    const secondBody = (await second.json()) as {
      contractVersion: string;
      delivery: { deliveryId: string; otp: string };
    };
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(secondBody).toMatchObject({ contractVersion: "1" });
    expect(
      (await consume(firstBody.delivery.deliveryId, firstBody.delivery.otp))
        .status,
    ).toBe(410);

    const consumed = await consume(
      secondBody.delivery.deliveryId,
      secondBody.delivery.otp,
    );
    expect(consumed.status).toBe(200);
    await expect(consumed.json()).resolves.toMatchObject({
      contractVersion: "1",
      classification: "SYNTHETIC-NON-FUNCTIONAL",
      applicationId: "app-test",
      credentialVersionId: activeVersion.versionId,
    });
    expect(
      (await consume(secondBody.delivery.deliveryId, secondBody.delivery.otp))
        .status,
    ).toBe(410);
  });
});
