import { describe, expect, it, vi } from "vitest";
import { handleRequest } from "../../src/index";
import type { WorkerEnv } from "../../src/config/env";
import { userFixtures } from "../fixtures/users";

const env: WorkerEnv = {
  AIRTABLE_BASE_ID: "app00000000000000",
  AIRTABLE_PAT: "test-token-value",
  DEMO_CREDENTIALS_JSON: JSON.stringify({
    "analyst@example.invalid": "correct-password",
    "disabled@example.invalid": "correct-password",
  }),
  SESSION_SIGNING_KEY: "test-signing-key-with-at-least-32-characters",
  DELIVERY_PEPPER: "test-delivery-pepper-with-at-least-32-characters",
};

const auditRecords: Array<{
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}> = [];

const airtableFetch = vi.fn(
  async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input
          : input.url,
    );
    const formula = url.searchParams.get("filterByFormula") ?? "";
    const table = decodeURIComponent(url.pathname.split("/").at(-1) ?? "");
    if (table === "AuditEvents") {
      if (init?.method === "POST") {
        const body = JSON.parse(String(init.body)) as {
          records: Array<{ fields: Record<string, unknown> }>;
        };
        const created = body.records.map(({ fields }) => ({
          id: `rec-audit-${auditRecords.length + 1}`,
          createdTime: "2026-08-15T09:00:00.000Z",
          fields,
        }));
        auditRecords.push(...created);
        return Response.json({ records: created });
      }
      const eventId = formula.match(/\{eventId\}='([^']+)'/u)?.[1];
      return Response.json({
        records: eventId
          ? auditRecords.filter(({ fields }) => fields.eventId === eventId)
          : auditRecords,
      });
    }
    const login = formula.match(/LOWER\(\{loginIdentifier\}\)='([^']+)'/u)?.[1];
    const id = formula.match(/\{userId\}='([^']+)'/u)?.[1];
    const users = userFixtures.filter(
      (user) =>
        (!login || user.loginIdentifier === login) &&
        (!id || user.userId === id),
    );
    return Response.json({
      records: users.map((fields, index) => ({
        id: `rec-${index}`,
        createdTime: "2026-08-15T09:00:00.000Z",
        fields,
      })),
    });
  },
);

describe("session contract", () => {
  it("creates and restores a session without exposing the password", async () => {
    vi.stubGlobal("fetch", airtableFetch);
    const response = await handleRequest(
      new Request("https://keyops.test/v1/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          loginIdentifier: "analyst@example.invalid",
          password: "correct-password",
        }),
      }),
      env,
    );
    expect(response.status).toBe(200);
    const session = (await response.json()) as {
      accessToken: string;
      user: { id: string };
    };
    expect(session.user.id).toBe("user-analyst");
    expect(JSON.stringify(session)).not.toContain("correct-password");

    const restored = await handleRequest(
      new Request("https://keyops.test/v1/session", {
        headers: { authorization: `Bearer ${session.accessToken}` },
      }),
      env,
    );
    expect(restored.status).toBe(200);
    await expect(restored.json()).resolves.toMatchObject({
      contractVersion: "1",
      user: { id: "user-analyst" },
    });
    vi.unstubAllGlobals();
  });

  it("uses one generic rejection for unknown and disabled users", async () => {
    vi.stubGlobal("fetch", airtableFetch);
    for (const loginIdentifier of [
      "missing@example.invalid",
      "disabled@example.invalid",
    ]) {
      const response = await handleRequest(
        new Request("https://keyops.test/v1/sessions", {
          method: "POST",
          body: JSON.stringify({
            loginIdentifier,
            password: "correct-password",
          }),
        }),
        env,
      );
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        code: "invalid_credentials",
      });
    }
    vi.unstubAllGlobals();
  });
});
