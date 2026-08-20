import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplicationFields } from "../../src/airtable/applicationSchema";
import { handleRequest } from "../../src/index";
import { applicationRecords } from "../fixtures/applications";
import { userFixtures } from "../fixtures/users";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { createAirtableFetch } from "../support/createAirtableFetch";
import { applicationEnv, authorizationHeader } from "../support/contractEnv";

const forbiddenMaterial =
  /client[_ -]?secret|real[_ -]?secret|password|airtable[_ -]?(?:pat|token)/iu;

describe("credential response, record and log redaction", () => {
  let store: InMemoryCredentialStore;
  let logged: unknown[][];

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
      AuditEvents: [],
    });
    vi.stubGlobal("fetch", createAirtableFetch(store));
    logged = [];
    for (const method of ["log", "warn", "error"] as const) {
      vi.spyOn(console, method).mockImplementation((...values: unknown[]) => {
        logged.push(values);
      });
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("exposes the OTP only in its one-time response", async () => {
    const headers = {
      ...(await authorizationHeader()),
      "idempotency-key": "credential-redaction-0001",
    };
    const issue = await handleRequest(
      new Request(
        "https://keyops.test/v1/applications/app-test/credentials?environment=test",
        { method: "POST", headers },
      ),
      applicationEnv,
    );
    const issued = (await issue.json()) as {
      delivery: { deliveryId: string; otp: string };
    };
    expect(issue.status).toBe(200);
    expect(issued.delivery.otp).toMatch(/^\d{6}$/u);

    const persisted = JSON.stringify({
      credentials: store.fields("Credentials"),
      versions: store.fields("CredentialVersions"),
      grants: store.fields("DeliveryGrants"),
      idempotency: store.fields("IdempotencyRecords"),
      audit: store.fields("AuditEvents"),
    });
    expect(persisted).not.toContain(issued.delivery.otp);
    expect(persisted).not.toMatch(forbiddenMaterial);

    const detail = await handleRequest(
      new Request(
        "https://keyops.test/v1/applications/app-test?environment=test",
        { headers: await authorizationHeader() },
      ),
      applicationEnv,
    );
    const detailPayload = JSON.stringify(await detail.json());
    expect(detail.status).toBe(200);
    expect(detailPayload).not.toContain(issued.delivery.otp);
    expect(detailPayload).not.toMatch(forbiddenMaterial);

    const rejected = await handleRequest(
      new Request(
        `https://keyops.test/v1/deliveries/${issued.delivery.deliveryId}/artifact`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code: "000000" }),
        },
      ),
      applicationEnv,
    );
    const rejectedPayload = JSON.stringify(await rejected.json());
    expect(rejected.status).toBe(410);
    expect(rejectedPayload).not.toContain(issued.delivery.otp);
    expect(rejectedPayload).not.toMatch(forbiddenMaterial);

    const logs = JSON.stringify(logged);
    expect(logs).not.toContain(issued.delivery.otp);
    expect(logs).not.toMatch(forbiddenMaterial);
  });
});
