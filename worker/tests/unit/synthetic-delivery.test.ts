import { describe, expect, it } from "vitest";
import { CredentialRepository } from "../../src/airtable/CredentialRepository";
import { DeliveryGrantRepository } from "../../src/airtable/DeliveryGrantRepository";
import type { ApplicationFields } from "../../src/airtable/applicationSchema";
import type {
  CredentialFields,
  CredentialVersionFields,
} from "../../src/airtable/credentialSchema";
import type { DeliveryGrantFields } from "../../src/airtable/operationSchema";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import { consumeDelivery } from "../../src/credentials/consumeDelivery";
import { createDelivery } from "../../src/credentials/createDelivery";
import { applicationRecords } from "../fixtures/applications";
import { activeCredential, activeVersion } from "../fixtures/credentials";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";

const pepper = "test-delivery-pepper-with-at-least-32-characters";
const now = "2026-08-15T12:00:00.000Z";
const analyst: AuthorizedUser = {
  id: "user-analyst",
  loginIdentifier: "analyst@example.invalid",
  displayName: "Analista Demo",
  profile: "analyst",
  enabled: true,
  permissions: ["credentials:deliver"],
};

function setup(state: "active" | "suspended" | "revoked" = "active") {
  const store = new InMemoryCredentialStore({
    Applications: [
      {
        ...applicationRecords[0]!.fields,
        credentialState: state,
        currentCredentialId: activeCredential.credentialId,
      } satisfies ApplicationFields,
    ],
    Credentials: [{ ...activeCredential, state } satisfies CredentialFields],
    CredentialVersions: [
      { ...activeVersion, state } satisfies CredentialVersionFields,
    ],
    DeliveryGrants: [
      {
        deliveryId: "delivery-previous",
        credentialVersionId: activeVersion.versionId,
        applicationId: "app-test",
        environment: "test",
        codeDigest: "a".repeat(64),
        expiresAt: "2026-08-15T12:02:00.000Z",
        operationId: "operation-previous",
        createdAt: "2026-08-15T11:59:00.000Z",
        schemaVersion: "1",
      } satisfies DeliveryGrantFields,
    ],
  });
  return {
    store,
    credentials: new CredentialRepository(store),
    deliveries: new DeliveryGrantRepository(store),
  };
}

describe("synthetic delivery", () => {
  it("does not reveal whether an unknown delivery exists", async () => {
    const dependencies = setup();
    await expect(
      consumeDelivery({
        deliveryId: "delivery-unknown",
        code: "000000",
        now,
        deliveryPepper: pepper,
        ...dependencies,
      }),
    ).rejects.toMatchObject({ status: 410, code: "delivery_unavailable" });
  });

  it("stores only a digest, expires in two minutes and invalidates the previous grant", async () => {
    const dependencies = setup();
    const result = await createDelivery({
      user: analyst,
      environment: "test",
      applicationId: "app-test",
      credentialId: activeCredential.credentialId,
      operationId: "operation-new-delivery",
      origin: "https://keyops.test",
      now,
      deliveryPepper: pepper,
      ...dependencies,
    });
    expect(result.delivery.otp).toMatch(/^\d{6}$/u);
    expect(result.delivery.otpExpiresAt).toBe("2026-08-15T12:02:00.000Z");
    const grants =
      dependencies.store.fields<DeliveryGrantFields>("DeliveryGrants");
    expect(grants[0]?.invalidatedAt).toBe(now);
    expect(grants[1]?.codeDigest).toMatch(/^[a-f0-9]{64}$/u);
    expect(JSON.stringify(grants)).not.toContain(result.delivery.otp);
  });

  it("returns a labelled artifact once and rejects used or expired codes", async () => {
    const dependencies = setup();
    const { delivery } = await createDelivery({
      user: analyst,
      environment: "test",
      applicationId: "app-test",
      credentialId: activeCredential.credentialId,
      operationId: "operation-consume",
      origin: "https://keyops.test",
      now,
      deliveryPepper: pepper,
      ...dependencies,
    });
    await expect(
      consumeDelivery({
        deliveryId: delivery.deliveryId,
        code: delivery.otp,
        now: "2026-08-15T12:01:00.000Z",
        deliveryPepper: pepper,
        ...dependencies,
      }),
    ).resolves.toEqual({
      classification: "SYNTHETIC-NON-FUNCTIONAL",
      applicationId: "app-test",
      credentialVersionId: activeVersion.versionId,
      generatedAt: "2026-08-15T12:01:00.000Z",
    });
    await expect(
      consumeDelivery({
        deliveryId: delivery.deliveryId,
        code: delivery.otp,
        now: "2026-08-15T12:01:01.000Z",
        deliveryPepper: pepper,
        ...dependencies,
      }),
    ).rejects.toMatchObject({ status: 410, code: "delivery_unavailable" });

    const expiring = setup();
    const expired = await createDelivery({
      user: analyst,
      environment: "test",
      applicationId: "app-test",
      credentialId: activeCredential.credentialId,
      operationId: "operation-expired",
      origin: "https://keyops.test",
      now,
      deliveryPepper: pepper,
      ...expiring,
    });
    await expect(
      consumeDelivery({
        deliveryId: expired.delivery.deliveryId,
        code: expired.delivery.otp,
        now: "2026-08-15T12:02:00.000Z",
        deliveryPepper: pepper,
        ...expiring,
      }),
    ).rejects.toMatchObject({ status: 410, code: "delivery_unavailable" });
  });

  it("rejects creation and consumption when the credential is not active", async () => {
    const revoked = setup("revoked");
    await expect(
      createDelivery({
        user: analyst,
        environment: "test",
        applicationId: "app-test",
        credentialId: activeCredential.credentialId,
        operationId: "operation-revoked",
        origin: "https://keyops.test",
        now,
        deliveryPepper: pepper,
        ...revoked,
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "invalid_credential_transition",
    });

    const active = setup();
    const created = await createDelivery({
      user: analyst,
      environment: "test",
      applicationId: "app-test",
      credentialId: activeCredential.credentialId,
      operationId: "operation-before-revoke",
      origin: "https://keyops.test",
      now,
      deliveryPepper: pepper,
      ...active,
    });
    const credentialRecord = (
      await active.store.list<CredentialFields>("Credentials")
    )[0]!;
    await active.store.update<CredentialFields>(
      "Credentials",
      credentialRecord.id,
      {
        state: "revoked",
      },
    );
    await expect(
      consumeDelivery({
        deliveryId: created.delivery.deliveryId,
        code: created.delivery.otp,
        now: "2026-08-15T12:01:00.000Z",
        deliveryPepper: pepper,
        ...active,
      }),
    ).rejects.toMatchObject({ status: 410, code: "delivery_unavailable" });
  });
});
