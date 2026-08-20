import { describe, expect, it } from "vitest";
import type { AuditAttempt } from "../../src/audit/AuditSink";
import { buildComplianceEvent } from "../../src/compliance/appendComplianceEvent";
import { retentionUntilFor } from "../../src/compliance/integrity";

const attempt = (overrides: Partial<AuditAttempt> = {}): AuditAttempt => ({
  operation: "application.view.v1",
  resourceType: "application",
  resourceId: "app-health",
  applicationId: "app-health",
  environment: "test",
  result: "succeeded",
  context: {
    requestId: "request-compliance-0001",
    originIp: "203.0.113.21",
    startedAt: "2026-08-15T12:00:00.000Z",
  },
  ...overrides,
});

describe("compliance event envelope", () => {
  it("builds a deterministic v2 event retained for five calendar years", async () => {
    const first = await buildComplianceEvent(attempt());
    const replay = await buildComplianceEvent(attempt());

    expect(first).toEqual(replay);
    expect(first).toMatchObject({
      eventId: expect.stringMatching(/^cmp-[a-f0-9]{32}$/u),
      schemaVersion: 2,
      occurredAt: "2026-08-15T12:00:00.000Z",
      retentionUntil: "2031-08-15T12:00:00.000Z",
      actorUserId: "anonymous",
    });
    expect(first).not.toHaveProperty("integrityReference");
  });

  it("clamps leap-day retention to the last day of February", () => {
    expect(retentionUntilFor("2024-02-29T08:15:00.000Z")).toBe(
      "2029-02-28T08:15:00.000Z",
    );
  });

  it.each([
    { resourceId: "https://delivery.invalid/secret" },
    { resourceId: "client-secret-material" },
    {
      actor: {
        id: "person@example.invalid",
        loginIdentifier: "person@example.invalid",
        displayName: "Persona",
        profile: "auditor" as const,
        enabled: true,
        permissions: ["audit:read" as const],
      },
    },
  ])("rejects unsafe or unnecessary personal material: %o", async (unsafe) => {
    await expect(buildComplianceEvent(attempt(unsafe))).rejects.toMatchObject({
      code: "unsafe_compliance_value",
    });
  });
});
