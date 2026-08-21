import {
  DELETE_ORDER,
  TABLE_NAMES,
  airtableSeed,
} from "../../scripts/airtable/seed-data.mjs";
import credentialFixture from "../../scripts/airtable/fixtures/credentials.json" with { type: "json" };
import type { AirtableClient } from "../airtable/AirtableClient";

const RESET_DELETE_ORDER = [
  "ApplicationOperationalContexts",
  ...DELETE_ORDER,
] as const;

type ResetClient = Pick<AirtableClient, "createMany" | "deleteMany" | "list">;
const credentialSeed = credentialFixture as {
  credentials: Record<string, unknown>[];
  versions: Record<string, unknown>[];
};
const credentialByApplication = new Map(
  credentialSeed.credentials.map((credential) => [
    String(credential.applicationId),
    credential,
  ]),
);
const seed: Record<string, Record<string, unknown>[]> = {
  ...(airtableSeed as Record<string, Record<string, unknown>[]>),
  Applications: (airtableSeed.Applications as Record<string, unknown>[]).map(
    (application) => {
      const credential = credentialByApplication.get(
        String(application.applicationId),
      );
      return credential
        ? {
            ...application,
            currentCredentialId: credential.credentialId,
            credentialState: credential.state,
            lastChangedAt: credential.lastChangedAt,
            updatedAt: credential.lastChangedAt,
          }
        : application;
    },
  ),
  Credentials: credentialSeed.credentials,
  CredentialVersions: credentialSeed.versions,
};

export async function resetDemoData(client: ResetClient) {
  const existing = new Map<string, string[]>();
  for (const table of RESET_DELETE_ORDER) {
    const records = await client.list<Record<string, unknown>>(table);
    const resettable =
      table === "AuditEvents"
        ? records.filter(({ fields }) => fields.mode !== "real")
        : records;
    existing.set(
      table,
      resettable.map(({ id }) => id),
    );
  }
  for (const table of RESET_DELETE_ORDER) {
    await client.deleteMany(table, existing.get(table) ?? []);
  }
  for (const table of TABLE_NAMES) {
    await client.createMany(table, seed[table] ?? []);
  }
  return Object.fromEntries(
    TABLE_NAMES.map((table) => [table, (seed[table] ?? []).length]),
  );
}
