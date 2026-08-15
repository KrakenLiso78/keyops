import { describe, expect, it } from "vitest";
import { CorporateCatalogHttpAdapter } from "../../src/catalog/CorporateCatalogHttpAdapter";
import { CorporateCatalogStub } from "../support/CorporateCatalogStub";

describe("neutral corporate catalog provider contract", () => {
  it("uses read-only GET with environment and explicit scope", async () => {
    const stub = new CorporateCatalogStub();
    const adapter = new CorporateCatalogHttpAdapter(
      { baseUrl: "https://catalog.test", readToken: "read-only-token" },
      stub.fetch,
    );
    await expect(
      adapter.list({
        environment: "test",
        query: "pago",
        scope: {
          actorUserId: "user-senior",
          allowedInstitutionIds: ["inst-salud"],
        },
      }),
    ).resolves.toMatchObject({
      items: [{ externalApplicationId: "app-test" }],
    });
    expect(stub.calls).toEqual([
      expect.objectContaining({
        method: "GET",
        url: "https://catalog.test/applications?environment=test&query=pago",
        authorization: "Bearer read-only-token",
      }),
    ]);
  });

  it("gets one current application and translates provider outages", async () => {
    const stub = new CorporateCatalogStub();
    const adapter = new CorporateCatalogHttpAdapter(
      { baseUrl: "https://catalog.test", readToken: "read-only-token" },
      stub.fetch,
    );
    await expect(
      adapter.get({
        externalApplicationId: "app-test",
        environment: "test",
        scope: { actorUserId: "user-senior" },
      }),
    ).resolves.toMatchObject({ name: "Pago en Línea" });
    stub.status = 503;
    await expect(
      adapter.list({
        environment: "test",
        scope: { actorUserId: "user-senior" },
      }),
    ).rejects.toMatchObject({ status: 503, code: "catalog_unavailable" });
  });

  it("translates invalid provider payloads without exposing their contents", async () => {
    const stub = new CorporateCatalogStub();
    stub.payload = {
      items: [{ environment: "test", providerSecret: "must-not-leak" }],
    };
    const adapter = new CorporateCatalogHttpAdapter(
      { baseUrl: "https://catalog.test", readToken: "read-only-token" },
      stub.fetch,
    );
    await expect(
      adapter.list({
        environment: "test",
        scope: { actorUserId: "user-senior" },
      }),
    ).rejects.toMatchObject({
      status: 503,
      code: "invalid_catalog_data",
      message: "El catálogo devolvió datos no válidos.",
    });
  });
});
