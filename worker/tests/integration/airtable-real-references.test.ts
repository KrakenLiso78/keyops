import { describe, expect, it } from "vitest";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { RealCredentialReferenceRepository } from "../../src/airtable/RealCredentialReferenceRepository";

declare const process: { env: Record<string, string | undefined> };

const enabled = process.env.RUN_AIRTABLE_INTEGRATION === "1";

async function deleteReference(
  baseId: string,
  token: string,
  referenceId: string,
) {
  const tableUrl = `https://api.airtable.com/v0/${baseId}/RealCredentialReferences`;
  const response = await fetch(tableUrl, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("No se pudo leer la referencia de prueba.");
  const payload = (await response.json()) as {
    records: Array<{ id: string; fields: Record<string, unknown> }>;
  };
  const record = payload.records.find(
    ({ fields }) => fields.referenceId === referenceId,
  );
  if (!record) return;
  const deleted = await fetch(`${tableUrl}?records[]=${record.id}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!deleted.ok)
    throw new Error("No se pudo limpiar la referencia de prueba.");
}

describe.skipIf(!enabled)("Airtable real credential references", () => {
  it("persists only safe metadata and restores it through a fresh client", async () => {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_PAT;
    const configuredReferenceId = process.env.AIRTABLE_REAL_REFERENCE_ID;
    if (!baseId || !token)
      throw new Error("Faltan AIRTABLE_BASE_ID o AIRTABLE_PAT.");
    const first = new RealCredentialReferenceRepository(
      new AirtableClient({ baseId, token }),
    );
    const existing = (await first.listReferences()).find(
      (reference) => reference.referenceId === configuredReferenceId,
    );
    const timestamp = new Date().toISOString();
    const original =
      existing ??
      (
        await first.saveReference({
          referenceId: `integration-reference-${Date.now()}`,
          externalCredentialId: `external-integration-${Date.now()}`,
          catalogApplicationId: "catalog-integration-test",
          environment: "test",
          externalVersionId: "external-version-integration",
          effectiveState: "active",
          lastOperationId: "integration-fixture",
          lastConfirmedAt: timestamp,
          updatedAt: timestamp,
          schemaVersion: "2",
        })
      ).fields;
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
      if (existing) {
        await new RealCredentialReferenceRepository(
          new AirtableClient({ baseId, token }),
        ).saveReference(original);
      } else {
        await deleteReference(baseId, token, original.referenceId);
      }
    }
  });
});
