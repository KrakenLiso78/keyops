import { describe, expect, it } from "vitest";
import { DeliveryGrantRepository } from "../../src/airtable/DeliveryGrantRepository";
import { CredentialRepository } from "../../src/airtable/CredentialRepository";
import { IdempotencyRepository } from "../../src/airtable/IdempotencyRepository";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import type { DeliveryGrantFields } from "../../src/airtable/operationSchema";
import {
  assertCredentialAction,
  nextCredentialState,
} from "../../src/credentials/stateMachine";
import {
  constantTimeEqual,
  deliveryCodeDigest,
  deriveOneTimeCode,
} from "../../src/credentials/syntheticDelivery";
import { userFixtures } from "../fixtures/users";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";

const user: AuthorizedUser = {
  id: userFixtures[0]!.userId,
  ...userFixtures[0]!,
  permissions: [
    "credentials:issue",
    "credentials:regenerate",
    "credentials:deliver",
    "credentials:suspend",
    "credentials:reactivate",
  ],
};
const now = "2026-08-15T10:00:00.000Z";
const pepper = "a-delivery-pepper-longer-than-thirty-two-characters";

describe("credential foundation", () => {
  it("enforces granular permissions, reasons and terminal transitions", () => {
    expect(() =>
      assertCredentialAction({
        user,
        action: "issue",
        state: "no_credentials",
      }),
    ).not.toThrow();
    expect(() =>
      assertCredentialAction({ user, action: "suspend", state: "active" }),
    ).toThrowError(/motivo/iu);
    expect(() =>
      assertCredentialAction({
        user,
        action: "reactivate",
        state: "revoked",
        reason: "Solicitud corregida",
      }),
    ).toThrowError(/transición/iu);
    expect(nextCredentialState("suspend")).toBe("suspended");
    expect(nextCredentialState("reactivate")).toBe("active");
    expect(nextCredentialState("revoke")).toBe("revoked");
  });

  it("derives a six-digit code and stores only its HMAC", async () => {
    const code = await deriveOneTimeCode(pepper, "delivery-1");
    const repeated = await deriveOneTimeCode(pepper, "delivery-1");
    const digest = await deliveryCodeDigest(pepper, "delivery-1", code);
    expect(code).toMatch(/^\d{6}$/u);
    expect(repeated).toBe(code);
    expect(digest).toMatch(/^[a-f0-9]{64}$/u);
    expect(digest).not.toContain(code);
    expect(constantTimeEqual(digest, digest)).toBe(true);
    expect(constantTimeEqual(digest, `${digest.slice(0, -1)}0`)).toBe(false);
  });

  it("persists idempotency receipts and rejects a conflicting fingerprint", async () => {
    const store = new InMemoryCredentialStore();
    const repository = new IdempotencyRepository(store);
    const first = await repository.reserve({
      scopeKey: "a".repeat(64),
      requestFingerprint: "b".repeat(64),
      operationId: "operation-1",
      now,
    });
    expect(first.created).toBe(true);
    expect(store.fields("IdempotencyRecords")[0]).not.toHaveProperty("now");
    await repository.commit(
      first.record,
      {
        operationId: "operation-1",
        requestId: "request-1",
        result: "succeeded",
      },
      now,
    );
    const repeated = await repository.reserve({
      scopeKey: "a".repeat(64),
      requestFingerprint: "b".repeat(64),
      operationId: "ignored",
      now,
    });
    expect(repeated.created).toBe(false);
    expect(repository.receipt(repeated.record)).toMatchObject({
      operationId: "operation-1",
      result: "succeeded",
    });
    await expect(
      repository.reserve({
        scopeKey: "a".repeat(64),
        requestFingerprint: "c".repeat(64),
        operationId: "operation-2",
        now,
      }),
    ).rejects.toMatchObject({ code: "idempotency_conflict", status: 409 });
  });

  it("derives fake application state from the credential seed table", async () => {
    const store = new InMemoryCredentialStore({
      Applications: [
        {
          applicationId: "app-006",
          name: "Carpeta ciudadana",
          searchName: "carpeta ciudadana",
          institutionId: "inst-junta",
          environment: "test",
          roleId: "role-consulta",
          declaredIps: "[]",
          credentialState: "active",
          lastChangedAt: now,
          updatedAt: now,
        },
      ],
    });
    const repository = new CredentialRepository(store, "fake");
    const application = await repository.getApplication("test", "app-006");
    expect(application.fields.credentialState).toBe("no_credentials");
    expect(application.fields.currentCredentialId).toBeUndefined();
  });

  it("invalidates an earlier grant and consumes a valid code once", async () => {
    const oldCode = await deriveOneTimeCode(pepper, "delivery-old");
    const currentCode = await deriveOneTimeCode(pepper, "delivery-current");
    const grant = async (
      deliveryId: string,
      code: string,
    ): Promise<DeliveryGrantFields> => ({
      deliveryId,
      credentialVersionId: "version-1",
      applicationId: "app-test",
      environment: "test",
      codeDigest: await deliveryCodeDigest(pepper, deliveryId, code),
      expiresAt: "2026-08-15T10:02:00.000Z",
      operationId: `operation-${deliveryId}`,
      createdAt: now,
      schemaVersion: "1",
    });
    const store = new InMemoryCredentialStore({
      DeliveryGrants: [
        await grant("delivery-old", oldCode),
        await grant("delivery-current", currentCode),
      ],
    });
    const repository = new DeliveryGrantRepository(store);
    await repository.invalidateAvailable("version-1", now);
    const all = store.fields<DeliveryGrantFields>("DeliveryGrants");
    expect(all.every(({ invalidatedAt }) => invalidatedAt === now)).toBe(true);

    const freshStore = new InMemoryCredentialStore({
      DeliveryGrants: [await grant("delivery-current", currentCode)],
    });
    const fresh = new DeliveryGrantRepository(freshStore);
    await expect(
      fresh.consume({
        deliveryId: "delivery-current",
        code: currentCode,
        pepper,
        now: "2026-08-15T10:01:00.000Z",
      }),
    ).resolves.toMatchObject({
      fields: { consumedAt: "2026-08-15T10:01:00.000Z" },
    });
    await expect(
      fresh.consume({
        deliveryId: "delivery-current",
        code: currentCode,
        pepper,
        now: "2026-08-15T10:01:01.000Z",
      }),
    ).rejects.toMatchObject({ status: 410, code: "delivery_unavailable" });
  });
});
