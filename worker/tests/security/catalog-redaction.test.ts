import { describe, expect, it } from "vitest";
import { CorporateCatalogHttpAdapter } from "../../src/catalog/CorporateCatalogHttpAdapter";
import { CorporateCatalogStub } from "../support/CorporateCatalogStub";

describe("corporate catalog security boundary", () => {
  it("keeps the read token out of URLs, payloads and controlled failures", async () => {
    const token = "catalog-super-secret-token";
    const stub = new CorporateCatalogStub();
    const adapter = new CorporateCatalogHttpAdapter(
      { baseUrl: "https://catalog.test", readToken: token },
      stub.fetch,
    );
    const page = await adapter.list({
      environment: "test",
      scope: {
        actorUserId: "user-scoped",
        allowedInstitutionIds: ["inst-salud"],
      },
    });
    expect(JSON.stringify(page)).not.toContain(token);
    expect(stub.calls[0]!.url).not.toContain(token);
    expect(stub.calls[0]!.method).toBe("GET");

    stub.status = 503;
    let controlled: unknown;
    try {
      await adapter.list({
        environment: "test",
        scope: { actorUserId: "user-scoped" },
      });
    } catch (error) {
      controlled = error;
    }
    expect(JSON.stringify(controlled)).not.toContain(token);
    expect(controlled).toMatchObject({ code: "catalog_unavailable" });
  });
});
