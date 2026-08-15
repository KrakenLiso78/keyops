import { describe, expect, it } from "vitest";
import { CredentialRepository } from "../../src/airtable/CredentialRepository";
import { DeliveryGrantRepository } from "../../src/airtable/DeliveryGrantRepository";
import type { ApplicationFields } from "../../src/airtable/applicationSchema";
import type {
  CredentialFields,
  CredentialVersionFields,
} from "../../src/airtable/credentialSchema";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import { regenerateCredential } from "../../src/credentials/regenerateCredential";
import { applicationRecords } from "../fixtures/applications";
import { activeCredential, activeVersion } from "../fixtures/credentials";
import { FailingCredentialStore } from "../support/FailingCredentialStore";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";

const now = "2026-08-15T11:00:00.000Z";
const pepper = "test-delivery-pepper-with-at-least-32-characters";
const analyst: AuthorizedUser = {
  id: "user-analyst",
  loginIdentifier: "analyst@example.invalid",
  displayName: "Analista Demo",
  profile: "analyst",
  enabled: true,
  permissions: ["credentials:regenerate"],
};

function seed() {
  return {
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
  };
}

function command(
  credentials: CredentialRepository,
  deliveries: DeliveryGrantRepository,
) {
  return {
    user: analyst,
    environment: "test" as const,
    applicationId: "app-test",
    credentialId: activeCredential.credentialId,
    operationId: "operation-regenerate-1",
    origin: "https://keyops.test",
    now,
    deliveryPepper: pepper,
    credentials,
    deliveries,
  };
}

describe("regenerateCredential", () => {
  it("rotates atomically to one active version and creates a delivery", async () => {
    const store = new InMemoryCredentialStore(seed());
    const result = await regenerateCredential(
      command(
        new CredentialRepository(store),
        new DeliveryGrantRepository(store),
      ),
    );
    const versions =
      store.fields<CredentialVersionFields>("CredentialVersions");
    expect(versions).toHaveLength(2);
    expect(versions.filter(({ state }) => state === "active")).toHaveLength(1);
    expect(
      versions.find(({ versionId }) => versionId === activeVersion.versionId)
        ?.state,
    ).toBe("rotated_inactive");
    expect(store.fields<CredentialFields>("Credentials")[0]).toMatchObject({
      currentVersionId: versions.find(({ state }) => state === "active")
        ?.versionId,
      state: "active",
    });
    expect(result.delivery.otp).toMatch(/^\d{6}$/u);
  });

  it("leaves the current version active after an intermediate failure and reconciles", async () => {
    const store = new InMemoryCredentialStore(seed());
    const failing = new FailingCredentialStore(store, 2);
    await expect(
      regenerateCredential(
        command(
          new CredentialRepository(failing),
          new DeliveryGrantRepository(failing),
        ),
      ),
    ).rejects.toMatchObject({ code: "simulated_provider_failure" });
    let versions = store.fields<CredentialVersionFields>("CredentialVersions");
    expect(versions.filter(({ state }) => state === "active")).toHaveLength(1);
    expect(versions.filter(({ state }) => state === "pending")).toHaveLength(1);

    await regenerateCredential(
      command(
        new CredentialRepository(store),
        new DeliveryGrantRepository(store),
      ),
    );
    versions = store.fields<CredentialVersionFields>("CredentialVersions");
    expect(versions.filter(({ state }) => state === "active")).toHaveLength(1);
    expect(versions.filter(({ state }) => state === "pending")).toHaveLength(0);
  });

  it("rejects regeneration without an active credential", async () => {
    const store = new InMemoryCredentialStore({
      ...seed(),
      Credentials: [],
      CredentialVersions: [],
    });
    await expect(
      regenerateCredential(
        command(
          new CredentialRepository(store),
          new DeliveryGrantRepository(store),
        ),
      ),
    ).rejects.toMatchObject({ status: 409 });
  });
});
