import { describe, expect, it } from "vitest";
import fixture from "../fixtures/catalog/applications.json";
import { catalogPageSchema } from "../../src/catalog/catalogSchemas";
import { joinOperationalContext } from "../../src/applications/joinOperationalContext";
import type { PersistedOperationalContext } from "../../src/airtable/ApplicationOperationalContextRepository";

const catalog = catalogPageSchema.parse(fixture).items;
const context: PersistedOperationalContext = {
  recordId: "rec-context-1",
  fields: {
    contextId: "ctx-test-app-test",
    catalogApplicationId: "app-test",
    environment: "test",
    technicalContact: JSON.stringify({
      name: "Ángela Ruiz",
      email: "angela@example.invalid",
    }),
    managementReason: "Alta inicial",
    requestOrTicketId: "SOL-101",
    declaredIps: '["10.1.2.3"]',
    updatedAt: "2026-08-15T10:00:00.000Z",
  },
};

describe("corporate catalog operational join", () => {
  it("keeps corporate identity while adding only operational context", () => {
    expect(
      joinOperationalContext({ catalog: [catalog[0]!], contexts: [context] }),
    ).toEqual([
      expect.objectContaining({
        id: "app-test",
        name: "Pago en Línea",
        institution: { id: "inst-salud", name: "Ministerio de Salud" },
        apiRole: expect.objectContaining({ id: "role-mensajes" }),
        declaredIps: ["10.1.2.3"],
        management: expect.objectContaining({ requestOrTicketId: "SOL-101" }),
      }),
    ]);
  });

  it("rejects duplicate and orphaned operational contexts", () => {
    expect(() =>
      joinOperationalContext({
        catalog: [catalog[0]!],
        contexts: [context, context],
      }),
    ).toThrow("duplicado");
    expect(() =>
      joinOperationalContext({
        catalog: [catalog[1]!],
        contexts: [context],
      }),
    ).toThrow("sin aplicación corporativa");
  });
});
