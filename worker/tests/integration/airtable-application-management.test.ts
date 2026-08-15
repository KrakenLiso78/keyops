import { describe, expect, it } from "vitest";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { ApplicationRepository } from "../../src/airtable/ApplicationRepository";

declare const process: { env: Record<string, string | undefined> };

const enabled = process.env.RUN_AIRTABLE_INTEGRATION === "1";

describe.skipIf(!enabled)("Airtable application management", () => {
  it("persists across fresh clients and restores the original ticket", async () => {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_PAT;
    if (!baseId || !token)
      throw new Error("Faltan AIRTABLE_BASE_ID o AIRTABLE_PAT.");

    const first = new ApplicationRepository(
      new AirtableClient({ baseId, token }),
    );
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
    let changedVersion: string | undefined;
    try {
      const changed = await first.updateManagement(
        "test",
        original.id,
        original.updatedAt,
        { requestOrTicketId: marker },
      );
      changedVersion = changed.updatedAt;

      const second = new ApplicationRepository(
        new AirtableClient({ baseId, token }),
      );
      await expect(second.get("test", original.id)).resolves.toMatchObject({
        management: { requestOrTicketId: marker },
      });
    } finally {
      if (changedVersion) {
        const cleanup = new ApplicationRepository(
          new AirtableClient({ baseId, token }),
        );
        await cleanup.updateManagement("test", original.id, changedVersion, {
          requestOrTicketId: original.management.requestOrTicketId,
        });
      }
    }
  });
});
