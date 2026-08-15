import { describe, expect, it, vi } from "vitest";
import type { WorkerEnv } from "../../src/config/env";
import { issueSessionToken } from "../../src/auth/sessionToken";
import { handleRequest } from "../../src/index";
import { userFixtures } from "../fixtures/users";

const env: WorkerEnv = {
  AIRTABLE_BASE_ID: "app00000000000000",
  AIRTABLE_PAT: "test-token-value",
  DEMO_CREDENTIALS_JSON: "{}",
  SESSION_SIGNING_KEY: "test-signing-key-with-at-least-32-characters",
  DELIVERY_PEPPER: "test-delivery-pepper-with-at-least-32-characters",
};

describe("Airtable rate limit", () => {
  it("returns a controlled 429 without activating local fake data", async () => {
    let providerCalls = 0;
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = new URL(
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input
            : input.url,
      );
      if (url.pathname.endsWith("/Users")) {
        return Response.json({
          records: [
            {
              id: "rec-user",
              createdTime: new Date().toISOString(),
              fields: userFixtures[0],
            },
          ],
        });
      }
      providerCalls += 1;
      return Response.json(
        { error: { type: "RATE_LIMIT_REACHED" } },
        { status: 429, headers: { "retry-after": "0" } },
      );
    });
    const { token } = await issueSessionToken(
      "user-analyst",
      env.SESSION_SIGNING_KEY,
    );
    const response = await handleRequest(
      new Request("https://keyops.test/v1/applications?environment=test", {
        headers: { authorization: `Bearer ${token}` },
      }),
      env,
    );
    expect(response.status).toBe(429);
    const payload = await response.json();
    expect(payload).toMatchObject({
      code: "provider_rate_limited",
      retryable: true,
    });
    expect(JSON.stringify(payload)).not.toContain("Notificaciones judiciales");
    expect(providerCalls).toBeGreaterThanOrEqual(4);
  });
});
