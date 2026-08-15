import { describe, expect, it } from "vitest";
import { RealCredentialReferenceRepository } from "../../src/airtable/RealCredentialReferenceRepository";
import type { AuditSink } from "../../src/audit/AuditSink";
import { RealOperationService } from "../../src/credentials/real/realOperationService";
import { authorizedUserFixture } from "../fixtures/users";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { RealCredentialProviderStub } from "../support/RealCredentialProviderStub";
import { SecureDeliveryStub } from "../support/SecureDeliveryStub";

const now = "2026-08-15T12:00:00.000Z";

describe("real credential partial failures", () => {
  it.each(["metadata", "audit", "delivery"] as const)(
    "reconciles a failure after provider confirmation at %s",
    async (failure) => {
      const store =
        failure === "metadata"
          ? new FailOnceReferenceStore()
          : new InMemoryCredentialStore({
              RealCredentialReferences: [],
              RealOperationReceipts: [],
            });
      const provider = new RealCredentialProviderStub();
      const delivery = new SecureDeliveryStub(() => new Date(now).getTime());
      if (failure === "delivery") delivery.failNextPreparation();
      const audit = new FailOnceAudit(failure === "audit");
      const references = new RealCredentialReferenceRepository(store);
      const service = new RealOperationService({
        provider,
        delivery,
        references,
        audit,
        allowedEnvironments: new Set(["test"]),
        now: () => now,
        operationId: () => `operation-${failure}`,
      });
      const command = {
        action: "issue" as const,
        applicationId: `app-${failure}`,
        environment: "test" as const,
        idempotencyKey: `failure-${failure}-key-0001`,
      };

      const uncertain = await service.execute({
        user: authorizedUserFixture,
        context: context(`request-${failure}-1`),
        command,
      });
      const recovered = await service.execute({
        user: authorizedUserFixture,
        context: context(`request-${failure}-2`),
        command,
      });

      expect(uncertain.status).toBe("reconciliation_required");
      expect(recovered).toMatchObject({
        status: "confirmed",
        result: "succeeded",
      });
      expect(
        provider.calls.filter(({ method }) => method === "issue"),
      ).toHaveLength(1);
      expect(await references.listReferences()).toHaveLength(1);
    },
  );
});

class FailOnceReferenceStore extends InMemoryCredentialStore {
  private shouldFail = true;

  constructor() {
    super({ RealCredentialReferences: [], RealOperationReceipts: [] });
  }

  override async create<TFields>(table: string, fields: TFields) {
    if (table === "RealCredentialReferences" && this.shouldFail) {
      this.shouldFail = false;
      throw new Error("Injected metadata failure");
    }
    return super.create(table, fields);
  }
}

class FailOnceAudit implements AuditSink {
  private shouldFail: boolean;

  constructor(shouldFail: boolean) {
    this.shouldFail = shouldFail;
  }

  async append() {
    if (this.shouldFail) {
      this.shouldFail = false;
      throw new Error("Injected audit failure");
    }
    return { auditEventId: crypto.randomUUID() };
  }
}

function context(requestId: string) {
  return { requestId, originIp: "192.0.2.12", startedAt: now };
}
