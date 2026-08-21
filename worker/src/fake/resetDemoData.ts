import {
  DELETE_ORDER,
  TABLE_NAMES,
  airtableSeed,
} from "../../scripts/airtable/seed-data.mjs";
import type { AirtableClient } from "../airtable/AirtableClient";

const RESET_DELETE_ORDER = [
  "ApplicationOperationalContexts",
  ...DELETE_ORDER,
] as const;

type ResetClient = Pick<AirtableClient, "createMany" | "deleteMany" | "list">;
const seed = airtableSeed as Record<string, Record<string, unknown>[]>;

export async function resetDemoData(client: ResetClient) {
  const existing = new Map<string, string[]>();
  for (const table of RESET_DELETE_ORDER) {
    const records = await client.list(table);
    existing.set(
      table,
      records.map(({ id }) => id),
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
