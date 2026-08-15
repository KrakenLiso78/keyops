import { describe, expect, it } from "vitest";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { RealCredentialReferenceRepository } from "../../src/airtable/RealCredentialReferenceRepository";

declare const process: { env: Record<string, string | undefined> };

const enabled =
  process.env.RUN_AIRTABLE_INTEGRATION === "1" &&
  Boolean(process.env.AIRTABLE_REAL_REFERENCE_ID);

describe.skipIf(!enabled)("Airtable real credential references", () => {
  it("persists only safe metadata and restores it through a fresh client", async () => {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_PAT;
    const referenceId = process.env.AIRTABLE_REAL_REFERENCE_ID;
    if (!baseId || !token || !referenceId) {
      throw new Error(
        "Faltan AIRTABLE_BASE_ID, AIRTABLE_PAT o AIRTABLE_REAL_REFERENCE_ID.",
      );
    }
    const first = new RealCredentialReferenceRepository(
      new AirtableClient({ baseId, token }),
    );
    const original = (await first.listReferences()).find(
      (reference) => reference.referenceId === referenceId,
    );
    if (!original) {
      throw new Error(
        "No existe la referencia real de integración configurada.",
      );
    }
    const marker = `airtable-integration-${Date.now()}`;
    try {
      await first.saveReference({
        ...original,
        lastOperationId: marker,
        updatedAt: new Date().toISOString(),
      });
      const fresh = new RealCredentialReferenceRepository(
        new AirtableClient({ baseId, token }),
      );
      const restored = await fresh.findByReference(
        original.environment,
        original.catalogApplicationId,
        original.referenceId,
      );
      expect(restored?.fields.lastOperationId).toBe(marker);
      expect(JSON.stringify(restored)).not.toMatch(
        /client.?secret|zipPassword|"otp"|deliveryUrl/iu,
      );
    } finally {
      await new RealCredentialReferenceRepository(
        new AirtableClient({ baseId, token }),
      ).saveReference(original);
    }
  });
});
