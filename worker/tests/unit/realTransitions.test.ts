import { beforeEach, describe, expect, it } from "vitest";
import { RealCredentialReferenceRepository } from "../../src/airtable/RealCredentialReferenceRepository";
import { noOpAuditSink } from "../../src/audit/AuditSink";
import { authorize } from "../../src/auth/authorize";
import { RealOperationService } from "../../src/credentials/real/realOperationService";
import { authorizedUserFixture } from "../fixtures/users";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { RealCredentialProviderStub } from "../support/RealCredentialProviderStub";
import { SecureDeliveryStub } from "../support/SecureDeliveryStub";

const now = "2026-08-15T12:00:00.000Z";

describe("real credential transitions", () => {
  let provider: RealCredentialProviderStub;
  let references: RealCredentialReferenceRepository;
  let service: RealOperationService;
  let sequence: number;

  beforeEach(() => {
    sequence = 0;
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
      operationId: () => `transition-operation-${++sequence}`,
    });
  });

  it("confirms acceptance after suspend, reactivate and terminal revoke", async () => {
    await service.execute({
      user: authorizedUserFixture,
      context: context("request-issue"),
      command: {
        action: "issue",
        applicationId: "app-transition",
        environment: "test",
        idempotencyKey: "transition-issue-key-01",
      },
    });
    const reference = (await references.listReferences())[0]!;

    await transition("suspend", "Pausa autorizada", "transition-suspend-01");
    expect(provider.activeVersions(reference.externalCredentialId)).toBe(0);
    expect((await references.listReferences())[0]!.effectiveState).toBe(
      "suspended",
    );

    await transition(
      "reactivate",
      "Reanudación autorizada",
      "transition-reactivate-01",
    );
    expect(provider.activeVersions(reference.externalCredentialId)).toBe(1);

    await transition("revoke", "Baja definitiva", "transition-revoke-001");
    expect(provider.activeVersions(reference.externalCredentialId)).toBe(0);
    expect((await references.listReferences())[0]!.effectiveState).toBe(
      "revoked",
    );

    const rejected = await transition(
      "reactivate",
      "Intento posterior",
      "transition-reactivate-02",
    );
    expect(rejected).toMatchObject({ status: "confirmed", result: "rejected" });

    async function transition(
      action: "suspend" | "reactivate" | "revoke",
      reason: string,
      idempotencyKey: string,
    ) {
      return service.execute({
        user: authorizedUserFixture,
        context: context(`request-${action}`),
        command: {
          action,
          applicationId: "app-transition",
          credentialId: reference.referenceId,
          environment: "test",
          idempotencyKey,
          reason,
        },
      });
    }
  });

  it("denies a transition permission that is not explicitly granted", () => {
    expect(() =>
      authorize(
        { ...authorizedUserFixture, permissions: ["applications:read"] },
        "credentials:revoke",
      ),
    ).toThrow("No tienes permiso");
  });
});

function context(requestId: string) {
  return { requestId, originIp: "192.0.2.13", startedAt: now };
}
