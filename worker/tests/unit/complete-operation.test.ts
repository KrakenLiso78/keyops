import { describe, expect, it } from "vitest";
import { AuditRecorder } from "../../src/audit/AuditRecorder";
import { ApiError } from "../../src/http/ApiError";
import { completeOperation } from "../../src/http/completeOperation";
import { InMemoryAuditRepository } from "../support/InMemoryAuditRepository";

const attempt = {
  operation: "application.update.v1",
  resourceType: "application",
  resourceId: "app-test",
  environment: "test" as const,
  applicationId: "app-test",
  context: {
    requestId: "request-complete-0001",
    originIp: "203.0.113.41",
    startedAt: "2026-08-15T12:00:00.000Z",
  },
};

describe("completeOperation", () => {
  it("persists success before returning and can recover an existing audit id", async () => {
    const repository = new InMemoryAuditRepository();
    const audit = new AuditRecorder(
      repository,
      () => "2026-08-15T12:01:00.000Z",
    );
    const completed = await completeOperation({
      audit,
      attempt,
      execute: async () => ({ updated: true }),
    });
    expect(completed.value).toEqual({ updated: true });
    expect((await repository.list())[0]?.fields.result).toBe("succeeded");

    const recovered = await completeOperation({
      audit,
      attempt,
      existingAuditEventId: completed.auditEventId,
      execute: async () => ({ updated: true }),
    });
    expect(recovered.auditEventId).toBe(completed.auditEventId);
    expect(await repository.list()).toHaveLength(1);
  });

  it.each([
    [new ApiError(409, "stale_application", "Conflicto"), "rejected"],
    [new Error("provider exploded"), "failed"],
  ] as const)("records a controlled result for %s", async (error, result) => {
    const repository = new InMemoryAuditRepository();
    const audit = new AuditRecorder(
      repository,
      () => "2026-08-15T12:02:00.000Z",
    );
    await expect(
      completeOperation({
        audit,
        attempt,
        execute: async () => {
          throw error;
        },
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect((await repository.list())[0]?.fields).toMatchObject({ result });
  });

  it("does not communicate success when the audit append fails", async () => {
    const repository = new InMemoryAuditRepository();
    repository.failAppend = true;
    await expect(
      completeOperation({
        audit: new AuditRecorder(repository),
        attempt,
        execute: async () => "business-result",
      }),
    ).rejects.toThrow("simulated audit append failure");
  });
});
