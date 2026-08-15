import { beforeEach, describe, expect, it } from "vitest";
import { RealCredentialReferenceRepository } from "../../src/airtable/RealCredentialReferenceRepository";
import { noOpAuditSink } from "../../src/audit/AuditSink";
import { RealOperationService } from "../../src/credentials/real/realOperationService";
import { authorizedUserFixture } from "../fixtures/users";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { RealCredentialProviderStub } from "../support/RealCredentialProviderStub";
import { SecureDeliveryStub } from "../support/SecureDeliveryStub";

const now = "2026-08-15T12:00:00.000Z";

describe("real operation idempotency and reconciliation", () => {
  let provider: RealCredentialProviderStub;
  let references: RealCredentialReferenceRepository;
  let service: RealOperationService;

  beforeEach(() => {
    provider = new RealCredentialProviderStub();
    references = new RealCredentialReferenceRepository(
      new InMemoryCredentialStore({
        RealCredentialReferences: [],
        RealOperationReceipts: [],
      }),
    );
    service = new RealOperationService({
      provider,
      delivery: new SecureDeliveryStub(() => new Date(now).getTime()),
      references,
      audit: noOpAuditSink,
      allowedEnvironments: new Set(["test"]),
      now: () => now,
      operationId: () => "stable-operation-id",
    });
  });

  it("reconciles a lost provider response without repeating its effect", async () => {
    provider.loseNextResponse();
    const command = {
      action: "issue" as const,
      applicationId: "app-test",
      environment: "test" as const,
      idempotencyKey: "lost-response-key-001",
    };

    const uncertain = await service.execute({
      user: authorizedUserFixture,
      context: context("request-first"),
      command,
    });
    const reconciled = await service.execute({
      user: authorizedUserFixture,
      context: context("request-retry"),
      command,
    });

    expect(uncertain).toMatchObject({
      status: "reconciliation_required",
      result: "failed",
    });
    expect(reconciled).toMatchObject({
      operationId: "stable-operation-id",
      status: "confirmed",
      result: "succeeded",
    });
    expect(
      provider.calls.filter(({ method }) => method === "issue"),
    ).toHaveLength(1);
    expect(
      provider.calls.filter(({ method }) => method === "status"),
    ).toHaveLength(1);
    expect(await references.listReferences()).toHaveLength(1);
  });

  it("reuses the stable provider key when the first call failed before the effect", async () => {
    provider.failNextBeforeEffect();
    const command = {
      action: "issue" as const,
      applicationId: "app-retry",
      environment: "test" as const,
      idempotencyKey: "retry-before-key-001",
    };

    await service.execute({
      user: authorizedUserFixture,
      context: context("request-first"),
      command,
    });
    const retried = await service.execute({
      user: authorizedUserFixture,
      context: context("request-second"),
      command,
    });

    expect(retried).toMatchObject({ status: "confirmed", result: "succeeded" });
    expect(
      provider.calls.filter(({ method }) => method === "issue"),
    ).toHaveLength(2);
    expect(await references.listReferences()).toHaveLength(1);
  });

  it("rejects reuse of an idempotency key with a different command", async () => {
    const shared = {
      applicationId: "app-test",
      environment: "test" as const,
      idempotencyKey: "conflicting-key-0001",
    };
    await service.execute({
      user: authorizedUserFixture,
      context: context("request-first"),
      command: { ...shared, action: "issue" },
    });

    await expect(
      service.execute({
        user: authorizedUserFixture,
        context: context("request-conflict"),
        command: { ...shared, action: "rotate", credentialId: "different" },
      }),
    ).rejects.toMatchObject({ code: "idempotency_conflict", status: 409 });
  });

  it("does not disclose operation status to another non-admin user", async () => {
    const receipt = await service.execute({
      user: authorizedUserFixture,
      context: context("request-owner"),
      command: {
        action: "issue",
        applicationId: "app-private-operation",
        environment: "test",
        idempotencyKey: "private-operation-key-1",
      },
    });

    await expect(
      service.status({
        user: { ...authorizedUserFixture, id: "different-user" },
        operationId: receipt.operationId,
        context: context("request-other-user"),
      }),
    ).rejects.toMatchObject({ code: "real_operation_not_found", status: 404 });
  });
});

function context(requestId: string) {
  return { requestId, originIp: "192.0.2.11", startedAt: now };
}
