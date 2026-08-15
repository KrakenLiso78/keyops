import { describe, expect, it } from "vitest";
import fixture from "../fixtures/catalog/applications.json";
import {
  catalogApplicationSchema,
  catalogPageSchema,
} from "../../src/catalog/catalogSchemas";

describe("corporate catalog schemas", () => {
  it("accepts the strict neutral contract", () => {
    expect(catalogPageSchema.parse(fixture).items).toHaveLength(2);
  });

  it("rejects incomplete and provider-specific fields", () => {
    const valid = fixture.items[0]!;
    const { externalRoleId: _missing, ...incomplete } = valid;
    expect(() => catalogApplicationSchema.parse(incomplete)).toThrow();
    expect(() =>
      catalogApplicationSchema.parse({ ...valid, providerSecret: "hidden" }),
    ).toThrow();
  });

  it("rejects duplicate application/environment pairs", () => {
    expect(() =>
      catalogPageSchema.parse({ items: [fixture.items[0], fixture.items[0]] }),
    ).toThrow("Duplicate corporate application identifier");
  });
});
