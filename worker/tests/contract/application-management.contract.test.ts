import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleRequest } from "../../src/index";
import { createApplicationAirtableFetch } from "../fixtures/applications";
import { userFixtures } from "../fixtures/users";
import { applicationEnv, authorizationHeader } from "../support/contractEnv";

describe("PATCH /v1/applications/{applicationId}/management", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createApplicationAirtableFetch(userFixtures));
  });

  it("persists a validated management value and returns the new version", async () => {
    const response = await handleRequest(
      new Request(
        "https://keyops.test/v1/applications/app-test/management?environment=test",
        {
          method: "PATCH",
          headers: {
            ...(await authorizationHeader()),
            "content-type": "application/json",
            "if-match": '"2026-08-15T09:00:00.000Z"',
          },
          body: JSON.stringify({
            technicalContact: {
              name: "Nuevo contacto",
              email: "new@example.invalid",
            },
            reason: "Cambio solicitado",
            requestOrTicketId: "SOL-202",
          }),
        },
      ),
      applicationEnv,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("etag")).toMatch(/^".+"$/u);
    await expect(response.json()).resolves.toMatchObject({
      application: {
        management: {
          technicalContact: { name: "Nuevo contacto" },
          reason: "Cambio solicitado",
          requestOrTicketId: "SOL-202",
        },
      },
    });
  });

  it("rejects stale, missing and invalid writes", async () => {
    const cases = [
      { version: '"stale"', body: {}, status: 409, code: "stale_application" },
      { version: undefined, body: {}, status: 428, code: "if_match_required" },
      {
        version: '"2026-08-15T09:00:00.000Z"',
        body: { reason: "x".repeat(501) },
        status: 400,
        code: "invalid_management",
      },
    ];
    for (const testCase of cases) {
      const headers: Record<string, string> = {
        ...(await authorizationHeader()),
        "content-type": "application/json",
      };
      if (testCase.version) headers["if-match"] = testCase.version;
      const response = await handleRequest(
        new Request(
          "https://keyops.test/v1/applications/app-test/management?environment=test",
          { method: "PATCH", headers, body: JSON.stringify(testCase.body) },
        ),
        applicationEnv,
      );
      expect(response.status).toBe(testCase.status);
      await expect(response.json()).resolves.toMatchObject({
        code: testCase.code,
      });
    }
  });

  it("enforces permission and maps provider failure to a controlled 503", async () => {
    vi.stubGlobal(
      "fetch",
      createApplicationAirtableFetch([
        { ...userFixtures[0]!, permissions: ["applications:read"] },
      ]),
    );
    const forbidden = await handleRequest(
      new Request(
        "https://keyops.test/v1/applications/app-test/management?environment=test",
        {
          method: "PATCH",
          headers: {
            ...(await authorizationHeader()),
            "content-type": "application/json",
            "if-match": '"2026-08-15T09:00:00.000Z"',
          },
          body: "{}",
        },
      ),
      applicationEnv,
    );
    expect(forbidden.status).toBe(403);

    const baseFetch = createApplicationAirtableFetch(userFixtures);
    vi.stubGlobal(
      "fetch",
      async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "PATCH") return Response.json({}, { status: 503 });
        return baseFetch(input, init);
      },
    );
    const unavailable = await handleRequest(
      new Request(
        "https://keyops.test/v1/applications/app-test/management?environment=test",
        {
          method: "PATCH",
          headers: {
            ...(await authorizationHeader()),
            "content-type": "application/json",
            "if-match": '"2026-08-15T09:00:00.000Z"',
          },
          body: "{}",
        },
      ),
      applicationEnv,
    );
    expect(unavailable.status).toBe(503);
    await expect(unavailable.json()).resolves.toMatchObject({
      code: "provider_unavailable",
      retryable: true,
    });
  });
});
