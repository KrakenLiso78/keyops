import { describe, expect, it } from "vitest";
import { CredentialRepository } from "../../src/airtable/CredentialRepository";
import { DeliveryGrantRepository } from "../../src/airtable/DeliveryGrantRepository";
import type { ApplicationFields } from "../../src/airtable/applicationSchema";
import type { CredentialFields } from "../../src/airtable/credentialSchema";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import { transitionCredential } from "../../src/credentials/transitionCredential";
import { applicationRecords } from "../fixtures/applications";
import { activeCredential, activeVersion } from "../fixtures/credentials";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";

const analyst: AuthorizedUser = {
  id: "user-analyst",
  loginIdentifier: "analyst@example.invalid",
  displayName: "Analista Demo",
  profile: "analyst",
  enabled: true,
  permissions: ["credentials:suspend", "credentials:reactivate"],
};

function setup() {
  const store = new InMemoryCredentialStore({
    Applications: [
      {
        ...applicationRecords[0]!.fields,
        credentialState: "active",
        currentCredentialId: activeCredential.credentialId,
      } satisfies ApplicationFields,
    ],
    Credentials: [activeCredential],
    CredentialVersions: [activeVersion],
    DeliveryGrants: [],
  });
  return {
    store,
    credentials: new CredentialRepository(store),
    deliveries: new DeliveryGrantRepository(store),
  };
}

describe("credential suspension and reactivation", () => {
  it("persists active to suspended to active with a reason", async () => {
    const dependencies = setup();
    const shared = {
      user: analyst,
      environment: "test" as const,
      applicationId: "app-test",
      credentialId: activeCredential.credentialId,
      reason: "Pausa operativa solicitada",
      now: "2026-08-15T12:00:00.000Z",
      ...dependencies,
    };
    await transitionCredential({
      ...shared,
      action: "suspend",
      operationId: "operation-suspend",
    });
    expect(
      dependencies.store.fields<CredentialFields>("Credentials")[0]?.state,
    ).toBe("suspended");
    await transitionCredential({
      ...shared,
      action: "reactivate",
      operationId: "operation-reactivate",
      now: "2026-08-15T12:01:00.000Z",
    });
    expect(
      dependencies.store.fields<CredentialFields>("Credentials")[0]?.state,
    ).toBe("active");
  });

  it("requires reason and permission and rejects a revoked credential", async () => {
    const dependencies = setup();
    const base = {
      user: analyst,
      environment: "test" as const,
      applicationId: "app-test",
      credentialId: activeCredential.credentialId,
      action: "suspend" as const,
      operationId: "operation-suspend",
      now: "2026-08-15T12:00:00.000Z",
      ...dependencies,
    };
    await expect(
      transitionCredential({ ...base, reason: "" }),
    ).rejects.toMatchObject({
      status: 400,
      code: "reason_required",
    });
    await expect(
      transitionCredential({
        ...base,
        user: { ...analyst, permissions: [] },
        reason: "Pausa",
      }),
    ).rejects.toMatchObject({ status: 403, code: "forbidden" });

    const revokedStore = new InMemoryCredentialStore({
      Applications: [
        {
          ...applicationRecords[0]!.fields,
          credentialState: "revoked",
          currentCredentialId: activeCredential.credentialId,
        } satisfies ApplicationFields,
      ],
      Credentials: [{ ...activeCredential, state: "revoked" }],
      CredentialVersions: [{ ...activeVersion, state: "revoked" }],
      DeliveryGrants: [],
    });
    await expect(
      transitionCredential({
        ...base,
        action: "reactivate",
        reason: "Intento posterior",
        operationId: "operation-reactivate-revoked",
        credentials: new CredentialRepository(revokedStore),
        deliveries: new DeliveryGrantRepository(revokedStore),
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "invalid_credential_transition",
    });
  });
});
