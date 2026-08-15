import { describe, expect, it } from "vitest";
import type { AuditAttempt } from "../../src/audit/AuditSink";
import { createAuditEvent } from "../../src/audit/auditEventFactory";
import { redactAudit } from "../../src/audit/redactAudit";
import {
  createRequestContext,
  withRequestActor,
} from "../../src/http/requestContext";

const base: AuditAttempt = {
  actor: {
    id: "user-senior",
    loginIdentifier: "senior@example.invalid",
    displayName: "Analista Senior",
    profile: "senior_analyst",
    enabled: true,
    permissions: ["audit:read"],
  },
  operation: "credential.revoke.v1",
  resourceType: "credential",
  resourceId: "cred-app-test",
  environment: "test",
  applicationId: "app-test",
  credentialId: "cred-app-test",
  result: "succeeded",
  operationId: "operation-revoke",
  context: {
    requestId: "request-audit-0001",
    originIp: "203.0.113.40",
    startedAt: "2026-08-15T12:00:00.000Z",
  },
};

describe("audit event factory", () => {
  it("builds the same allowlisted event for the same attempt", async () => {
    const first = await createAuditEvent(base, "2026-08-15T12:01:00.000Z");
    const second = await createAuditEvent(base, "2026-08-15T12:01:00.000Z");
    expect(second).toEqual(first);
    expect(first).toMatchObject({
      schemaVersion: 1,
      actorUserId: "user-senior",
      actorDisplayName: "Analista Senior",
      operation: "credential.revoke.v1",
      result: "succeeded",
      requestId: "request-audit-0001",
    });
    expect(first).not.toHaveProperty("loginIdentifier");
    expect(first.eventId).toMatch(/^evt-20260815120100000-[a-f0-9]{16}$/u);
  });

  it("uses eventId as a deterministic tie breaker", async () => {
    const left = await createAuditEvent(base, "2026-08-15T12:01:00.000Z");
    const right = await createAuditEvent(
      {
        ...base,
        context: { ...base.context, requestId: "request-audit-0002" },
      },
      "2026-08-15T12:01:00.000Z",
    );
    expect(left.occurredAt).toBe(right.occurredAt);
    expect(left.eventId).not.toBe(right.eventId);
    expect(
      [left, right].toSorted((a, b) => b.eventId.localeCompare(a.eventId)),
    ).toHaveLength(2);
  });

  it("rejects unknown, unversioned and unsafe fields", () => {
    const valid = {
      eventId: "evt-20260815120100000-aaaaaaaaaaaaaaaa",
      schemaVersion: 1,
      occurredAt: "2026-08-15T12:01:00.000Z",
      actorUserId: "user-senior",
      actorDisplayName: "Analista Senior",
      operation: "credential.revoke.v1",
      resourceType: "credential",
      resourceId: "cred-app-test",
      result: "rejected",
      originIp: "203.0.113.40",
      failureCode: "forbidden",
      requestId: "request-audit-0001",
    };
    expect(() =>
      redactAudit({ ...valid, password: "irrelevant" }),
    ).toThrowError();
    expect(() => redactAudit({ ...valid, operation: "revoke" })).toThrowError();
    expect(() =>
      redactAudit({ ...valid, resourceId: "https://delivery.invalid" }),
    ).toThrowError();
  });

  it("normalizes trusted request metadata and attaches the established actor", () => {
    const context = createRequestContext(
      new Request("https://keyops.test/v1/audit-events", {
        headers: {
          "x-request-id": "request-context-0001",
          "cf-connecting-ip": "203.0.113.44",
        },
      }),
    );
    expect(context).toMatchObject({
      requestId: "request-context-0001",
      originIp: "203.0.113.44",
    });
    expect(withRequestActor(context, base.actor!)).toMatchObject({
      actor: { id: "user-senior" },
    });
    expect(
      createRequestContext(
        new Request("https://keyops.test", {
          headers: { "cf-connecting-ip": "999.1.1.1" },
        }),
      ).originIp,
    ).toBe("unknown");
  });
});
