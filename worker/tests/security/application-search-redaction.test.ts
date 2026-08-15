import { describe, expect, it } from "vitest";
import { mapApplications } from "../../src/airtable/applicationMapper";
import {
  applicationRecords,
  institutionRecords,
  roleRecords,
} from "../fixtures/applications";

describe("application allowlist", () => {
  it("never maps provider IDs, search helpers or secret-like extra fields", () => {
    const records = structuredClone(applicationRecords);
    Object.assign(records[0]!.fields, {
      clientSecret: "must-not-leak",
      deliveryUrl: "https://secret.invalid",
    });

    const serialized = JSON.stringify(
      mapApplications(records, institutionRecords, roleRecords),
    );
    expect(serialized).not.toMatch(
      /rec-app|searchName|clientSecret|deliveryUrl|must-not-leak/u,
    );
  });
});
