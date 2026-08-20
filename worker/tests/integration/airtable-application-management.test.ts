import { describe, expect, it } from "vitest";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { ApplicationRepository } from "../../src/airtable/ApplicationRepository";

declare const process: { env: Record<string, string | undefined> };

const enabled = process.env.RUN_AIRTABLE_INTEGRATION === "1";

describe.skipIf(!enabled)("Airtable application management", () => {
  it("persists across clients, rejects a stale write and restores the fixture", async () => {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_PAT;
    if (!baseId || !token)
      throw new Error("Faltan AIRTABLE_BASE_ID o AIRTABLE_PAT.");

    let requestCount = 0;
    const client = () =>
      new AirtableClient({
        baseId,
        token,
        fetcher: async (input, init) => {
          requestCount += 1;
          return fetch(input, init);
        },
      });

    const first = new ApplicationRepository(client());
    const page = await first.list({ environment: "test", page: 1 });
    const original = page.items.find(
      (item) => item.management.requestOrTicketId,
    );
    if (!original?.management.requestOrTicketId) {
      throw new Error(
        "El seed no contiene una aplicación test con ticket restaurable.",
      );
    }
    const marker = `INTEGRATION-${Date.now()}`;
    const staleMarker = `${marker}-STALE`;
    let changedVersion: string | undefined;
    try {
      const second = new ApplicationRepository(client());
      const changed = await second.updateManagement(
        "test",
        original.id,
        original.updatedAt,
        { requestOrTicketId: marker },
      );
      changedVersion = changed.updatedAt;

      await expect(
        first.updateManagement("test", original.id, original.updatedAt, {
          requestOrTicketId: staleMarker,
        }),
      ).rejects.toMatchObject({ status: 409, code: "stale_application" });

      const fresh = new ApplicationRepository(client());
      await expect(fresh.get("test", original.id)).resolves.toMatchObject({
        management: { requestOrTicketId: marker },
      });
    } finally {
      if (changedVersion) {
        const cleanup = new ApplicationRepository(client());
        await cleanup.updateManagement("test", original.id, changedVersion, {
          requestOrTicketId: original.management.requestOrTicketId,
        });
      }
    }
    expect(requestCount).toBe(25);
  });
});
