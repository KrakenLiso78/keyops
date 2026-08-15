import { describe, expect, it } from "vitest";
import { AuditRecorder } from "../../src/audit/AuditRecorder";
import { redactAudit } from "../../src/audit/redactAudit";
import { InMemoryAuditRepository } from "../support/InMemoryAuditRepository";

const safe = {
  eventId: "evt-20260815120100000-aaaaaaaaaaaaaaaa",
  schemaVersion: 1,
  occurredAt: "2026-08-15T12:01:00.000Z",
  actorUserId: "user-auditor",
  actorDisplayName: "Auditora Demo",
  operation: "audit.list.v1",
  resourceType: "audit",
  result: "rejected",
  originIp: "203.0.113.42",
  failureCode: "forbidden",
  requestId: "request-redact-0001",
};

describe("audit redaction", () => {
  it.each([
    ["password", "clave-super-secreta"],
    ["token", "Bearer abc.def.ghi"],
    ["otp", "482193"],
    ["deliveryUrl", "https://delivery.invalid/artifact"],
    ["stack", "Error at handler:20"],
  ])("rejects prohibited %s material", (field, value) => {
    expect(() => redactAudit({ ...safe, [field]: value })).toThrowError();
  });

  it("persists only the explicit safe projection", async () => {
    const repository = new InMemoryAuditRepository();
    const recorder = new AuditRecorder(repository, () => safe.occurredAt);
    await recorder.append({
      actor: {
        id: safe.actorUserId,
        loginIdentifier: "auditor@example.invalid",
        displayName: safe.actorDisplayName,
        profile: "auditor",
        enabled: true,
        permissions: ["audit:read"],
      },
      operation: safe.operation,
      resourceType: safe.resourceType,
      result: safe.result as "rejected",
      failureCode: safe.failureCode,
      context: {
        requestId: safe.requestId,
        originIp: safe.originIp,
        startedAt: safe.occurredAt,
      },
    });
    const serialized = JSON.stringify(await repository.list());
    expect(serialized).not.toMatch(
      /loginIdentifier|password|token|otp|deliveryUrl|stack/iu,
    );
    expect(serialized).toContain("audit.list.v1");
  });
});
