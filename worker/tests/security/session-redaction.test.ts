import { describe, expect, it } from "vitest";
import { errorResponse } from "../../src/http/ApiError";

describe("session redaction", () => {
  it("never serializes raw exceptions or credentials", async () => {
    const response = errorResponse(
      new Error("password=secret AIRTABLE_PAT=pat-secret"),
      "request-redaction-test",
    );
    const serialized = await response.text();
    expect(serialized).not.toMatch(/secret|AIRTABLE_PAT|password=/iu);
    expect(serialized).toContain("unexpected_error");
  });
});
