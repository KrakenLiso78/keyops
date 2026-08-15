import { beforeEach, describe, expect, it, vi } from "vitest";
import { issueSessionToken } from "../../src/auth/sessionToken";
import type { WorkerEnv } from "../../src/config/env";
import { handleRequest } from "../../src/index";
import { createApplicationAirtableFetch } from "../fixtures/applications";
import { userFixtures } from "../fixtures/users";

export const applicationEnv: WorkerEnv = {
  AIRTABLE_BASE_ID: "app00000000000000",
  AIRTABLE_PAT: "test-token-value",
  DEMO_CREDENTIALS_JSON: "{}",
  SESSION_SIGNING_KEY: "test-signing-key-with-at-least-32-characters",
  DELIVERY_PEPPER: "test-delivery-pepper-with-at-least-32-characters",
};

export async function authorizationHeader() {
  const { token } = await issueSessionToken(
    "user-analyst",
    applicationEnv.SESSION_SIGNING_KEY,
  );
  return { authorization: `Bearer ${token}` };
}

describe("GET /v1/applications", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createApplicationAirtableFetch(userFixtures));
  });

  it("returns a versioned, environment-scoped page", async () => {
    const response = await handleRequest(
      new Request(
        "https://keyops.test/v1/applications?environment=test&query=pago&page=1",
        {
          headers: await authorizationHeader(),
        },
      ),
      applicationEnv,
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      contractVersion: "1",
      page: 1,
      pageSize: 20,
      total: 1,
      items: [{ id: "app-test", environment: "test" }],
    });
  });

  it("rejects unauthenticated and invalid queries with controlled errors", async () => {
    const unauthorized = await handleRequest(
      new Request("https://keyops.test/v1/applications?environment=test"),
      applicationEnv,
    );
    expect(unauthorized.status).toBe(401);

    const invalid = await handleRequest(
      new Request("https://keyops.test/v1/applications?environment=unknown", {
        headers: await authorizationHeader(),
      }),
      applicationEnv,
    );
    expect(invalid.status).toBe(400);
    await expect(invalid.json()).resolves.toMatchObject({
      code: "invalid_query",
    });
  });
});
