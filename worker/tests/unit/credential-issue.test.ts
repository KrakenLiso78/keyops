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
import { issueCredential } from "../../src/credentials/issueCredential";
import { applicationRecords } from "../fixtures/applications";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";

const now = "2026-08-15T10:00:00.000Z";
const pepper = "test-delivery-pepper-with-at-least-32-characters";
const analyst: AuthorizedUser = {
  id: "user-analyst",
  loginIdentifier: "analyst@example.invalid",
  displayName: "Analista Demo",
  profile: "analyst",
  enabled: true,
  permissions: ["credentials:issue"],
};

function setup() {
  const application: ApplicationFields = {
    ...applicationRecords[0]!.fields,
    credentialState: "no_credentials",
    currentCredentialId: undefined,
  };
  const store = new InMemoryCredentialStore({
    Applications: [application],
    Credentials: [],
    CredentialVersions: [],
    DeliveryGrants: [],
  });
  return {
    store,
    credentials: new CredentialRepository(store),
    deliveries: new DeliveryGrantRepository(store),
  };
}

describe("issueCredential", () => {
  it("creates one active synthetic version and an expiring delivery", async () => {
    const dependencies = setup();
    const result = await issueCredential({
      user: analyst,
      environment: "test",
      applicationId: "app-test",
      operationId: "operation-issue-1",
      origin: "https://keyops.test",
      now,
      deliveryPepper: pepper,
      credentials: dependencies.credentials,
      deliveries: dependencies.deliveries,
    });
    expect(result.delivery.otp).toMatch(/^\d{6}$/u);
    expect(result.delivery.deliveryUrl).not.toContain(result.delivery.otp);
    expect(
      dependencies.store.fields<CredentialFields>("Credentials"),
    ).toHaveLength(1);
    expect(
      dependencies.store.fields<CredentialVersionFields>("CredentialVersions"),
    ).toEqual([expect.objectContaining({ state: "active", sequence: 1 })]);
    expect(
      dependencies.store.fields<ApplicationFields>("Applications")[0],
    ).toMatchObject({ credentialState: "active" });
    const grant =
      dependencies.store.fields<DeliveryGrantFields>("DeliveryGrants")[0]!;
    expect(grant.codeDigest).not.toContain(result.delivery.otp);
    expect(Date.parse(grant.expiresAt) - Date.parse(now)).toBe(120_000);
  });

  it("reconciles the same operation and rejects another initial issue", async () => {
    const dependencies = setup();
    const command = {
      user: analyst,
      environment: "test" as const,
      applicationId: "app-test",
      operationId: "operation-issue-1",
      origin: "https://keyops.test",
      now,
      deliveryPepper: pepper,
      credentials: dependencies.credentials,
      deliveries: dependencies.deliveries,
    };
    const first = await issueCredential(command);
    const replay = await issueCredential(command);
    expect(replay).toEqual(first);
    expect(
      dependencies.store.fields<CredentialFields>("Credentials"),
    ).toHaveLength(1);
    await expect(
      issueCredential({ ...command, operationId: "operation-issue-2" }),
    ).rejects.toMatchObject({
      status: 409,
      code: "invalid_credential_transition",
    });
  });

  it("rejects a user without permission before writing", async () => {
    const dependencies = setup();
    await expect(
      issueCredential({
        user: { ...analyst, permissions: [] },
        environment: "test",
        applicationId: "app-test",
        operationId: "operation-forbidden",
        origin: "https://keyops.test",
        now,
        deliveryPepper: pepper,
        credentials: dependencies.credentials,
        deliveries: dependencies.deliveries,
      }),
    ).rejects.toMatchObject({ status: 403, code: "forbidden" });
    expect(
      dependencies.store.fields<CredentialFields>("Credentials"),
    ).toHaveLength(0);
  });
});
