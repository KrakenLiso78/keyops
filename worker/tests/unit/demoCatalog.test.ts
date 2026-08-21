import { describe, expect, it } from "vitest";
import { AirtableDemoCatalogAdapter } from "../../src/catalog/AirtableDemoCatalogAdapter";
import {
  applicationRecords,
  institutionRecords,
  roleRecords,
} from "../fixtures/applications";

describe("demo catalog adapter", () => {
  it("reads persisted demo data from Airtable and honors scope", async () => {
    const catalog = new AirtableDemoCatalogAdapter({
      list: async (table) => {
        const records =
          table === "Applications"
            ? applicationRecords
            : table === "Institutions"
              ? institutionRecords
              : table === "ApiRoles"
                ? roleRecords
                : [];
        return records as never;
      },
    });

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
      catalog.list({
        environment: "production",
        scope: { actorUserId: "user-demo" },
      }),
    ).resolves.toMatchObject({
      items: [{ externalApplicationId: "app-production" }],
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
