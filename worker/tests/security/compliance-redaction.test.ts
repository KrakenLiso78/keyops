import { describe, expect, it } from "vitest";
import { buildComplianceEvent } from "../../src/compliance/appendComplianceEvent";

describe("compliance redaction", () => {
  it("contains only the canonical allowlist and no secret-bearing input", async () => {
    const event = await buildComplianceEvent({
      operation: "user.update.v1",
      resourceType: "user",
      resourceId: "user-001",
      result: "rejected",
      failureCode: "forbidden",
      context: {
        requestId: "request-redaction-0001",
        originIp: "203.0.113.26",
        startedAt: "2026-08-15T12:06:00.000Z",
      },
    });

    expect(Object.keys(event).sort()).toEqual(
      [
        "actorUserId",
        "eventId",
        "failureCode",
        "occurredAt",
        "operation",
        "originIp",
        "payloadFingerprint",
        "requestId",
        "resourceId",
        "resourceType",
        "result",
        "retentionUntil",
        "schemaVersion",
      ].sort(),
    );
    expect(JSON.stringify(event)).not.toMatch(
      /secret|password|bearer|otp|delivery.?url|access.?token/iu,
    );
  });
});
