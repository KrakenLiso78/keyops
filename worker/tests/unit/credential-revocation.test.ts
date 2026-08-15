import { describe, expect, it } from "vitest";
import { CredentialRepository } from "../../src/airtable/CredentialRepository";
import { DeliveryGrantRepository } from "../../src/airtable/DeliveryGrantRepository";
import type { ApplicationFields } from "../../src/airtable/applicationSchema";
import type { CredentialFields } from "../../src/airtable/credentialSchema";
import type { DeliveryGrantFields } from "../../src/airtable/operationSchema";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import { transitionCredential } from "../../src/credentials/transitionCredential";
import { applicationRecords } from "../fixtures/applications";
import { activeCredential, activeVersion } from "../fixtures/credentials";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";

const senior: AuthorizedUser = {
  id: "user-senior",
  loginIdentifier: "senior@example.invalid",
  displayName: "Analista Senior",
  profile: "senior_analyst",
  enabled: true,
  permissions: [
    "credentials:revoke",
    "credentials:reactivate",
    "credentials:deliver",
  ],
};

function setup(state: "active" | "suspended" = "active") {
  const store = new InMemoryCredentialStore({
    Applications: [
      {
        ...applicationRecords[0]!.fields,
        credentialState: state,
        currentCredentialId: activeCredential.credentialId,
      } satisfies ApplicationFields,
    ],
    Credentials: [{ ...activeCredential, state }],
    CredentialVersions: [{ ...activeVersion, state }],
    DeliveryGrants: [
      {
        deliveryId: "delivery-active",
        credentialVersionId: activeVersion.versionId,
        applicationId: "app-test",
        environment: "test",
        codeDigest: "a".repeat(64),
        expiresAt: "2026-08-15T12:02:00.000Z",
        operationId: "operation-delivery",
        createdAt: "2026-08-15T12:00:00.000Z",
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

describe("credential revocation", () => {
  it.each(["active", "suspended"] as const)(
    "revokes terminally from %s",
    async (state) => {
      const dependencies = setup(state);
      await transitionCredential({
        user: senior,
        environment: "test",
        applicationId: "app-test",
        credentialId: activeCredential.credentialId,
        action: "revoke",
        reason: "Baja definitiva autorizada",
        operationId: `operation-revoke-${state}`,
        now: "2026-08-15T12:00:00.000Z",
        ...dependencies,
      });
      expect(
        dependencies.store.fields<CredentialFields>("Credentials")[0]?.state,
      ).toBe("revoked");
      expect(
        dependencies.store.fields<DeliveryGrantFields>("DeliveryGrants")[0]
          ?.invalidatedAt,
      ).toBe("2026-08-15T12:00:00.000Z");
      await expect(
        transitionCredential({
          user: senior,
          environment: "test",
          applicationId: "app-test",
          credentialId: activeCredential.credentialId,
          action: "reactivate",
          reason: "Intento posterior",
          operationId: "operation-reactivate-revoked",
          now: "2026-08-15T12:01:00.000Z",
          ...dependencies,
        }),
      ).rejects.toMatchObject({
        status: 409,
        code: "invalid_credential_transition",
      });
    },
  );

  it("rejects revocation by a non-senior profile even with a bad permission assignment", async () => {
    const dependencies = setup();
    await expect(
      transitionCredential({
        user: { ...senior, profile: "analyst" },
        environment: "test",
        applicationId: "app-test",
        credentialId: activeCredential.credentialId,
        action: "revoke",
        reason: "Intento no autorizado",
        operationId: "operation-forbidden",
        now: "2026-08-15T12:00:00.000Z",
        ...dependencies,
      }),
    ).rejects.toMatchObject({ status: 403, code: "forbidden" });
  });
});
