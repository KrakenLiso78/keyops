import { describe, expect, it } from "vitest";
import type { ApplicationFields } from "../../src/airtable/applicationSchema";
import type { IdempotencyFields } from "../../src/airtable/operationSchema";
import { CredentialRepository } from "../../src/airtable/CredentialRepository";
import { DeliveryGrantRepository } from "../../src/airtable/DeliveryGrantRepository";
import { issueCredential } from "../../src/credentials/issueCredential";
import { applicationRecords } from "../fixtures/applications";
import { userFixtures } from "../fixtures/users";
import { InMemoryCredentialStore } from "../support/InMemoryCredentialStore";

describe("synthetic material", () => {
  it("never persists or embeds OTP and real-secret fields", async () => {
    const store = new InMemoryCredentialStore({
      Applications: [
        {
          ...applicationRecords[0]!.fields,
          credentialState: "no_credentials",
          currentCredentialId: undefined,
        } satisfies ApplicationFields,
      ],
      Credentials: [],
      CredentialVersions: [],
      DeliveryGrants: [],
      IdempotencyRecords: [] satisfies IdempotencyFields[],
    });
    const result = await issueCredential({
      user: {
        id: userFixtures[0]!.userId,
        ...userFixtures[0]!,
        permissions: ["credentials:issue"],
      },
      environment: "test",
      applicationId: "app-test",
      operationId: "operation-security",
      origin: "https://keyops.test",
      now: "2026-08-15T10:00:00.000Z",
      deliveryPepper: "test-delivery-pepper-with-at-least-32-characters",
      credentials: new CredentialRepository(store),
      deliveries: new DeliveryGrantRepository(store),
    });
    const persisted = JSON.stringify({
      credentials: store.fields("Credentials"),
      versions: store.fields("CredentialVersions"),
      grants: store.fields("DeliveryGrants"),
    });
    expect(persisted).not.toContain(result.delivery.otp);
    expect(result.delivery.deliveryUrl).not.toContain(result.delivery.otp);
    expect(`${persisted}${JSON.stringify(result)}`).not.toMatch(
      /clientSecret|password|real[-_ ]?secret/iu,
    );
  });
});
