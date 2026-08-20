import { describe, expect, it } from "vitest";
import { mapUser } from "../../src/airtable/userMapper";
import type { AirtableRecord } from "../../src/airtable/AirtableClient";
import type { UserFields } from "../../src/airtable/userSchema";

describe("Airtable user mapper", () => {
  it("interprets an omitted unchecked checkbox as a disabled user", () => {
    const record = {
      id: "rec-disabled-user",
      createdTime: "2026-08-20T00:00:00.000Z",
      fields: {
        userId: "disabled-user",
        loginIdentifier: "disabled@example.invalid",
        displayName: "Usuario deshabilitado",
        profile: "analyst",
        permissions: ["applications:read"],
      },
    } as AirtableRecord<UserFields>;

    expect(mapUser(record)).toMatchObject({
      id: "disabled-user",
      enabled: false,
    });
  });
});
