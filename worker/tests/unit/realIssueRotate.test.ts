import { beforeEach, describe, expect, it } from "vitest";
import { RealCredentialReferenceRepository } from "../../src/airtable/RealCredentialReferenceRepository";
import { noOpAuditSink } from "../../src/audit/AuditSink";
import { RealOperationService } from "../../src/credentials/real/realOperationService";
import { authorizedUserFixture } from "../fixtures/users";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";
import { RealCredentialProviderStub } from "../support/RealCredentialProviderStub";
import { SecureDeliveryStub } from "../support/SecureDeliveryStub";

const now = "2026-08-15T12:00:00.000Z";

describe("real credential issue and rotation", () => {
  let store: InMemoryCredentialStore;
  let provider: RealCredentialProviderStub;
  let delivery: SecureDeliveryStub;
  let references: RealCredentialReferenceRepository;
  let service: RealOperationService;
  let sequence: number;

  beforeEach(() => {
    sequence = 0;
    store = new InMemoryCredentialStore({
      RealCredentialReferences: [],
      RealOperationReceipts: [],
    });
    provider = new RealCredentialProviderStub();
    delivery = new SecureDeliveryStub(() => new Date(now).getTime());
    references = new RealCredentialReferenceRepository(store);
    service = new RealOperationService({
      provider,
      delivery,
      references,
      audit: noOpAuditSink,
      allowedEnvironments: new Set(["test"]),
      now: () => now,
      operationId: () => `operation-${++sequence}`,
    });
  });

  it("issues and rotates with one accepted version and only safe receipts", async () => {
    const issued = await service.execute({
      user: authorizedUserFixture,
      context: context("request-issue"),
      command: {
        action: "issue",
        applicationId: "app-test",
        environment: "test",
        idempotencyKey: "issue-real-key-0001",
      },
    });
    const reference = (await references.listReferences())[0]!;

    expect(issued).toEqual({
      operationId: "operation-1",
      requestId: "request-issue",
      status: "confirmed",
      result: "succeeded",
      auditEventId: expect.any(String),
      delivery: {
        deliveryId: "delivery-operation-1",
        expiresAt: "2026-08-15T12:02:00.000Z",
      },
    });
    expect(provider.activeVersions(reference.externalCredentialId)).toBe(1);
    expect(JSON.stringify(issued)).not.toMatch(
      /client.?secret|password|otp|deliveryUrl/iu,
    );

    const rotated = await service.execute({
      user: authorizedUserFixture,
      context: context("request-rotate"),
      command: {
        action: "rotate",
        applicationId: "app-test",
        credentialId: reference.referenceId,
        environment: "test",
        idempotencyKey: "rotate-real-key-001",
      },
    });

    expect(rotated.status).toBe("confirmed");
    expect(rotated.result).toBe("succeeded");
    expect(provider.activeVersions(reference.externalCredentialId)).toBe(1);
    expect((await references.listReferences())[0]!.externalVersionId).toBe(
      "version-operation-2",
    );
  });

  it("keeps delivery password and OTP separate and outside persistence", async () => {
    const receipt = await service.execute({
      user: authorizedUserFixture,
      context: context("request-delivery"),
      command: {
        action: "issue",
        applicationId: "app-delivery",
        environment: "test",
        idempotencyKey: "issue-delivery-0001",
      },
    });
    const material = delivery.materialForTest(receipt.delivery!.deliveryId)!;

    expect(material.zipPassword).not.toBe(material.otp);
    expect(material.encryptedZip.slice(0, 2)).toEqual(
      new Uint8Array([0x50, 0x4b]),
    );
    expect(
      JSON.stringify(store.fields("RealCredentialReferences")),
    ).not.toContain(material.otp);
    expect(JSON.stringify(store.fields("RealOperationReceipts"))).not.toContain(
      material.zipPassword,
    );
  });
});

function context(requestId: string) {
  return {
    requestId,
    originIp: "192.0.2.10",
    startedAt: now,
  };
}
