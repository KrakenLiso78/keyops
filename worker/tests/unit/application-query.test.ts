import { describe, expect, it } from "vitest";
import { ApplicationRepository } from "../../src/airtable/ApplicationRepository";
import type { AirtableRecord } from "../../src/airtable/AirtableClient";
import { normalizeSearch } from "../../src/applications/normalizeSearch";
import {
  applicationRecords,
  institutionRecords,
  roleRecords,
} from "../fixtures/applications";

const client = {
  list: async <T>(table: string): Promise<AirtableRecord<T>[]> => {
    if (table === "Applications")
      return applicationRecords as AirtableRecord<T>[];
    if (table === "Institutions")
      return institutionRecords as AirtableRecord<T>[];
    if (table === "ApiRoles") return roleRecords as AirtableRecord<T>[];
    return [] as AirtableRecord<T>[];
  },
  update: async <T>() => applicationRecords[0] as AirtableRecord<T>,
};

describe("application query", () => {
  it("normalizes Spanish case and accents", () => {
    expect(normalizeSearch("  PÁGO en LÍNEA ")).toBe("pago en linea");
  });

  it("searches only authorized operational fields in the active environment", async () => {
    const repository = new ApplicationRepository(client);

    await expect(
      repository.list({ environment: "test", query: "angela", page: 1 }),
    ).resolves.toMatchObject({ total: 1, items: [{ id: "app-test" }] });
    await expect(
      repository.list({ environment: "test", query: "tributario", page: 1 }),
    ).resolves.toMatchObject({ total: 0, items: [] });
  });

  it("filters, sorts and paginates deterministically", async () => {
    const repository = new ApplicationRepository(client);
    await expect(
      repository.list({
        environment: "production",
        state: "revoked",
        sort: "lastChangedAt",
        page: 1,
      }),
    ).resolves.toMatchObject({
      page: 1,
      pageSize: 20,
      total: 1,
      items: [{ id: "app-production" }],
    });
  });
});
