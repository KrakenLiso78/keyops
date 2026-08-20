import { describe, expect, it } from "vitest";
import { AirtableClient } from "../../src/airtable/AirtableClient";
import { CredentialRepository } from "../../src/airtable/CredentialRepository";
import { DeliveryGrantRepository } from "../../src/airtable/DeliveryGrantRepository";
import type { ApplicationFields } from "../../src/airtable/applicationSchema";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import { consumeDelivery } from "../../src/credentials/consumeDelivery";
import { createDelivery } from "../../src/credentials/createDelivery";
import { issueCredential } from "../../src/credentials/issueCredential";
import { regenerateCredential } from "../../src/credentials/regenerateCredential";
import { transitionCredential } from "../../src/credentials/transitionCredential";

declare const process: { env: Record<string, string | undefined> };

const enabled = process.env.RUN_AIRTABLE_INTEGRATION === "1";
const senior: AuthorizedUser = {
  id: "integration-senior",
  loginIdentifier: "integration@example.invalid",
  displayName: "Integración KeyOps",
  profile: "senior_analyst",
  enabled: true,
  permissions: [
    "credentials:issue",
    "credentials:regenerate",
    "credentials:suspend",
    "credentials:reactivate",
    "credentials:deliver",
    "credentials:revoke",
  ],
};

type RawRecord = { id: string; fields: Record<string, unknown> };

async function airtableRequest(
  baseId: string,
  token: string,
  table: string,
  init: RequestInit = {},
) {
  const response = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
    {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        ...init.headers,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Airtable rechazó ${table} (${response.status}).`);
  }
  return response;
}

async function removeRun(
  baseId: string,
  token: string,
  table: string,
  runId: string,
) {
  const payload = (await (
    await airtableRequest(baseId, token, table)
  ).json()) as { records: RawRecord[] };
  const owned = payload.records.filter(({ fields }) =>
    String(fields.operationId ?? "").startsWith(runId),
  );
  for (let index = 0; index < owned.length; index += 10) {
    const url = new URL(
      `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`,
    );
    for (const { id } of owned.slice(index, index + 10)) {
      url.searchParams.append("records[]", id);
    }
    const deleted = await fetch(url, {
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!deleted.ok) {
      throw new Error(`No se pudo limpiar ${table} (${deleted.status}).`);
    }
  }
}

describe.skipIf(!enabled)("Airtable synthetic credential lifecycle", () => {
  it("persists all five stories and reloads them through fresh clients", async () => {
    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_PAT;
    const pepper = process.env.DELIVERY_PEPPER;
    if (!baseId || !token || !pepper) {
      throw new Error(
        "Faltan AIRTABLE_BASE_ID, AIRTABLE_PAT o DELIVERY_PEPPER.",
      );
    }
    const runId = `integration-credentials-${Date.now()}`;
    const client = new AirtableClient({ baseId, token });
    const applications = await client.list<ApplicationFields>("Applications");
    const application = applications.find(
      ({ fields }) =>
        fields.environment === "test" &&
        fields.credentialState === "no_credentials" &&
        !fields.currentCredentialId,
    );
    if (!application) {
      throw new Error(
        "No existe una aplicación test sin credenciales para la integración.",
      );
    }
    const original = structuredClone(application.fields);
    const at = (seconds: number) =>
      new Date(Date.now() + seconds * 1_000).toISOString();
    const dependencies = (fresh = new AirtableClient({ baseId, token })) => ({
      credentials: new CredentialRepository(fresh),
      deliveries: new DeliveryGrantRepository(fresh),
    });

    try {
      const issued = await issueCredential({
        user: senior,
        environment: "test",
        applicationId: original.applicationId,
        operationId: `${runId}-issue`,
        origin: "https://keyops.test",
        now: at(0),
        deliveryPepper: pepper,
        ...dependencies(client),
      });
      const replay = await issueCredential({
        user: senior,
        environment: "test",
        applicationId: original.applicationId,
        operationId: `${runId}-issue`,
        origin: "https://keyops.test",
        now: at(1),
        deliveryPepper: pepper,
        ...dependencies(),
      });
      expect(replay.delivery.deliveryId).toBe(issued.delivery.deliveryId);

      const aggregate = await dependencies().credentials.findByApplication(
        "test",
        original.applicationId,
      );
      const credentialId = aggregate!.credential.fields.credentialId;
      await regenerateCredential({
        user: senior,
        environment: "test",
        applicationId: original.applicationId,
        credentialId,
        operationId: `${runId}-regenerate`,
        origin: "https://keyops.test",
        now: at(2),
        deliveryPepper: pepper,
        ...dependencies(),
      });
      const rotated = await dependencies().credentials.findById(
        "test",
        original.applicationId,
        credentialId,
      );
      expect(
        rotated!.versions.filter(({ fields }) => fields.state === "active"),
      ).toHaveLength(1);

      await transitionCredential({
        user: senior,
        environment: "test",
        applicationId: original.applicationId,
        credentialId,
        action: "suspend",
        reason: "Pausa de integración",
        operationId: `${runId}-suspend`,
        now: at(3),
        ...dependencies(),
      });
      expect(
        (
          await dependencies().credentials.findById(
            "test",
            original.applicationId,
            credentialId,
          )
        )?.credential.fields.state,
      ).toBe("suspended");
      await transitionCredential({
        user: senior,
        environment: "test",
        applicationId: original.applicationId,
        credentialId,
        action: "reactivate",
        reason: "Reanudación de integración",
        operationId: `${runId}-reactivate`,
        now: at(4),
        ...dependencies(),
      });

      const delivery = await createDelivery({
        user: senior,
        environment: "test",
        applicationId: original.applicationId,
        credentialId,
        operationId: `${runId}-delivery`,
        origin: "https://keyops.test",
        now: at(5),
        deliveryPepper: pepper,
        ...dependencies(),
      });
      await expect(
        consumeDelivery({
          deliveryId: delivery.delivery.deliveryId,
          code: delivery.delivery.otp,
          now: at(6),
          deliveryPepper: pepper,
          ...dependencies(),
        }),
      ).resolves.toMatchObject({
        classification: "SYNTHETIC-NON-FUNCTIONAL",
      });
      await expect(
        consumeDelivery({
          deliveryId: delivery.delivery.deliveryId,
          code: delivery.delivery.otp,
          now: at(7),
          deliveryPepper: pepper,
          ...dependencies(),
        }),
      ).rejects.toMatchObject({ status: 410 });

      await transitionCredential({
        user: senior,
        environment: "test",
        applicationId: original.applicationId,
        credentialId,
        action: "revoke",
        reason: "Baja de integración",
        operationId: `${runId}-revoke`,
        now: at(8),
        ...dependencies(),
      });
      expect(
        (
          await dependencies().credentials.findById(
            "test",
            original.applicationId,
            credentialId,
          )
        )?.credential.fields.state,
      ).toBe("revoked");
    } finally {
      for (const table of [
        "DeliveryGrants",
        "CredentialVersions",
        "Credentials",
      ]) {
        await removeRun(baseId, token, table, runId);
      }
      await airtableRequest(baseId, token, "Applications", {
        method: "PATCH",
        body: JSON.stringify({
          records: [
            {
              id: application.id,
              fields: {
                currentCredentialId: original.currentCredentialId ?? null,
                credentialState: original.credentialState,
                lastChangedAt: original.lastChangedAt,
                updatedAt: original.updatedAt,
              },
            },
          ],
        }),
      });
    }
  });
});
