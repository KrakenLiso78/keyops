import { beforeEach, describe, expect, it, vi } from "vitest";
import { issueSessionToken } from "../../src/auth/sessionToken";
import type { AuditEventFields } from "../../src/audit/auditEventSchema";
import { handleRequest } from "../../src/index";
import { userFixtures } from "../fixtures/users";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { applicationEnv } from "../support/contractEnv";
import { createAirtableFetch } from "../support/createAirtableFetch";

describe("corporate application route failures", () => {
  let store: InMemoryCredentialStore;

  beforeEach(() => {
    store = new InMemoryCredentialStore({
      Users: userFixtures,
      ApplicationOperationalContexts: [],
      Credentials: [],
      CredentialVersions: [],
      AuditEvents: [],
    });
  });

  async function request(env = applicationEnv) {
    const { token } = await issueSessionToken(
      "user-analyst",
      applicationEnv.SESSION_SIGNING_KEY,
    );
    return handleRequest(
      new Request("https://keyops.test/v1/applications?environment=test", {
        headers: {
          authorization: `Bearer ${token}`,
          "x-request-id": "request-catalog-failure-0001",
        },
      }),
      env,
    );
  }

  it("reports provider unavailability and writes safe audit evidence", async () => {
    const baseFetch = createAirtableFetch(store);
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input
              : input.url,
        );
        if (url.hostname === "catalog.test") {
          return Response.json(
            { rawProviderError: "do-not-expose" },
            { status: 503 },
          );
        }
        return baseFetch(input, init);
      },
    );
    const response = await request();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "catalog_unavailable",
    });
    expect(store.fields<AuditEventFields>("AuditEvents")).toContainEqual(
      expect.objectContaining({
        operation: "application.list.v1",
        result: "failed",
        failureCode: "catalog_unavailable",
      }),
    );
    expect(JSON.stringify(store.fields("AuditEvents"))).not.toContain(
      "rawProviderError",
    );
  });

  it("never falls back to representative data when catalog bindings are absent", async () => {
    vi.stubGlobal("fetch", createAirtableFetch(store));
    const response = await request({
      ...applicationEnv,
      CATALOG_BASE_URL: undefined,
      CATALOG_READ_TOKEN: undefined,
    });
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      code: "catalog_not_configured",
    });
  });
});
