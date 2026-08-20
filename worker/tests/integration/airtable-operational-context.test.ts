import { describe, expect, it } from "vitest";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { ApplicationOperationalContextRepository } from "../../src/airtable/ApplicationOperationalContextRepository";

declare const process: { env: Record<string, string | undefined> };

const enabled = process.env.RUN_AIRTABLE_INTEGRATION === "1";

async function deleteRecord(
  baseId: string,
  token: string,
  table: string,
  recordId: string,
) {
  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${table}?records[]=${recordId}`,
    { method: "DELETE", headers: { authorization: `Bearer ${token}` } },
  );
  if (!response.ok) throw new Error(`No se pudo limpiar ${table}.`);
}

describe.skipIf(!enabled)("Airtable operational context", () => {
  it("persists a management change across fresh clients and restores it", async () => {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_PAT;
    if (!baseId || !token) {
      throw new Error("Faltan AIRTABLE_BASE_ID o AIRTABLE_PAT.");
    }
    const first = new ApplicationOperationalContextRepository(
      new AirtableClient({ baseId, token }),
    );
    const initialTimestamp = new Date().toISOString();
    const existing = (await first.list())[0];
    const original =
      existing ??
      (await first.saveManagement({
        environment: "test",
        catalogApplicationId: `integration-context-${Date.now()}`,
        expectedUpdatedAt: initialTimestamp,
        catalogUpdatedAt: initialTimestamp,
        requestOrTicketId: "INTEGRATION-FIXTURE",
        now: initialTimestamp,
      }));
    const marker = `CATALOG-INTEGRATION-${Date.now()}`;
    const originalContact = original.fields.technicalContact
      ? (JSON.parse(original.fields.technicalContact) as {
          name: string;
          email?: string;
          phone?: string;
        })
      : undefined;
    let changedVersion: string | undefined;
    try {
      const changed = await first.saveManagement({
        environment: original.fields.environment,
        catalogApplicationId: original.fields.catalogApplicationId,
        expectedUpdatedAt: original.fields.updatedAt,
        catalogUpdatedAt: original.fields.updatedAt,
        technicalContact: originalContact,
        reason: original.fields.managementReason,
        requestOrTicketId: marker,
      });
      changedVersion = changed.fields.updatedAt;
      const fresh = new ApplicationOperationalContextRepository(
        new AirtableClient({ baseId, token }),
      );
      await expect(
        fresh.get(
          original.fields.environment,
          original.fields.catalogApplicationId,
        ),
      ).resolves.toMatchObject({
        fields: { requestOrTicketId: marker },
      });
    } finally {
      if (!existing) {
        await deleteRecord(
          baseId,
          token,
          "ApplicationOperationalContexts",
          original.recordId,
        );
      } else if (changedVersion) {
        const cleanup = new ApplicationOperationalContextRepository(
          new AirtableClient({ baseId, token }),
        );
        await cleanup.saveManagement({
          environment: original.fields.environment,
          catalogApplicationId: original.fields.catalogApplicationId,
          expectedUpdatedAt: changedVersion,
          catalogUpdatedAt: original.fields.updatedAt,
          technicalContact: originalContact,
          reason: original.fields.managementReason,
          requestOrTicketId: original.fields.requestOrTicketId,
        });
      }
    }
  });
});
