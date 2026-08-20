import { describe, expect, it } from "vitest";
import { DemoCatalogAdapter } from "../../src/catalog/DemoCatalogAdapter";

describe("demo catalog adapter", () => {
  it("serves representative data without an external provider and honors scope", async () => {
    const catalog = new DemoCatalogAdapter();

    await expect(
      catalog.list({
        environment: "test",
        scope: {
          actorUserId: "user-demo",
          allowedInstitutionIds: ["inst-salud"],
        },
      }),
    ).resolves.toMatchObject({
      items: [{ externalApplicationId: "app-test" }],
    });

    await expect(
      catalog.get({
        externalApplicationId: "app-production",
        environment: "production",
        scope: {
          actorUserId: "user-demo",
          allowedInstitutionIds: ["inst-salud"],
        },
      }),
    ).rejects.toMatchObject({ code: "catalog_application_not_found" });
  });
});
