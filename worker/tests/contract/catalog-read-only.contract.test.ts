import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleRequest } from "../../src/index";
import { createApplicationAirtableFetch } from "../fixtures/applications";
import { userFixtures } from "../fixtures/users";
import { applicationEnv, authorizationHeader } from "../support/contractEnv";

describe("corporate catalog read-only boundary", () => {
  const providerMethods: string[] = [];

  beforeEach(() => {
    providerMethods.length = 0;
    const baseFetch = createApplicationAirtableFetch(userFixtures);
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
          providerMethods.push(init?.method ?? "GET");
        }
        return baseFetch(input, init);
      },
    );
  });

  it("uses only GET for list, detail and management validation", async () => {
    const headers = await authorizationHeader();
    const responses = await Promise.all([
      handleRequest(
        new Request("https://keyops.test/v1/applications?environment=test", {
          headers,
        }),
        applicationEnv,
      ),
      handleRequest(
        new Request(
          "https://keyops.test/v1/applications/app-test?environment=test",
          { headers },
        ),
        applicationEnv,
      ),
      handleRequest(
        new Request(
          "https://keyops.test/v1/applications/app-test/management?environment=test",
          {
            method: "PATCH",
            headers: {
              ...headers,
              "content-type": "application/json",
              "if-match": '"2026-08-15T09:00:00.000Z"',
            },
            body: JSON.stringify({ name: "Mutación corporativa prohibida" }),
          },
        ),
        applicationEnv,
      ),
    ]);
    expect(responses.map(({ status }) => status)).toEqual([200, 200, 400]);
    expect(providerMethods.length).toBeGreaterThan(0);
    expect(new Set(providerMethods)).toEqual(new Set(["GET"]));
  });
});
