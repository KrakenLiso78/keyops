import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleRequest } from "../../src/index";
import { createApplicationAirtableFetch } from "../fixtures/applications";
import { userFixtures } from "../fixtures/users";
import { applicationEnv, authorizationHeader } from "../support/contractEnv";

describe("GET /v1/applications/{applicationId}", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createApplicationAirtableFetch(userFixtures));
  });

  it("returns an allowlisted detail", async () => {
    const response = await handleRequest(
      new Request(
        "https://keyops.test/v1/applications/app-test?environment=test",
        {
          headers: await authorizationHeader(),
        },
      ),
      applicationEnv,
    );
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      contractVersion: "1",
      application: {
        id: "app-test",
        institution: { id: "inst-salud", name: "Ministerio de Salud" },
        apiRole: { id: "role-mensajes", name: "Envío de mensajes" },
      },
    });
    expect(JSON.stringify(payload)).not.toMatch(
      /clientSecret|rec-app|searchName/u,
    );
  });

  it("hides missing and wrong-environment applications behind 404", async () => {
    for (const url of [
      "https://keyops.test/v1/applications/missing?environment=test",
      "https://keyops.test/v1/applications/app-test?environment=production",
    ]) {
      const response = await handleRequest(
        new Request(url, { headers: await authorizationHeader() }),
        applicationEnv,
      );
      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toMatchObject({
        code: "application_not_found",
      });
    }
  });
});
