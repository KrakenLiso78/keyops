import { readFile } from "node:fs/promises";

type SeedRecord = { id: string; fields: Record<string, unknown> };
type CredentialFixture = {
  credentials: Array<Record<string, unknown>>;
  versions: Array<Record<string, unknown>>;
};

class SeedClient {
  private readonly baseId: string;
  private readonly token: string;
  private readonly fetcher: typeof fetch;

  constructor(baseId: string, token: string, fetcher: typeof fetch) {
    this.baseId = baseId;
    this.token = token;
    this.fetcher = fetcher;
  }

  private url(table: string) {
    return `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(table)}`;
  }

  async list(table: string): Promise<SeedRecord[]> {
    const records: SeedRecord[] = [];
    let offset: string | undefined;
    do {
      const url = new URL(this.url(table));
      url.searchParams.set("pageSize", "100");
      if (offset) url.searchParams.set("offset", offset);
      const response = await this.fetcher(url, {
        headers: { authorization: `Bearer ${this.token}` },
      });
      if (!response.ok)
        throw new Error(`Airtable rechazó la lectura (${response.status}).`);
      const page = (await response.json()) as {
        records: SeedRecord[];
        offset?: string;
      };
      records.push(...page.records);
      offset = page.offset;
    } while (offset);
    return records;
  }

  async write(
    table: string,
    method: "POST" | "PATCH",
    records: Array<Record<string, unknown>>,
  ) {
    for (let index = 0; index < records.length; index += 10) {
      const batch = records.slice(index, index + 10);
      const response = await this.fetcher(this.url(table), {
        method,
        headers: {
          authorization: `Bearer ${this.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ records: batch, typecast: true }),
      });
      if (!response.ok)
        throw new Error(`Airtable rechazó la escritura (${response.status}).`);
    }
  }
}

function validateFixture(fixture: CredentialFixture) {
  const credentials = fixture.credentials;
  const versions = fixture.versions;
  const unique = (records: Array<Record<string, unknown>>, field: string) =>
    new Set(records.map((record) => record[field])).size === records.length;
  if (!unique(credentials, "credentialId") || !unique(versions, "versionId")) {
    throw new Error("El fixture contiene identificadores duplicados.");
  }
  const versionIds = new Set(versions.map(({ versionId }) => versionId));
  const credentialIds = new Set(
    credentials.map(({ credentialId }) => credentialId),
  );
  for (const credential of credentials) {
    if (!String(credential.syntheticClientId).startsWith("synthetic_")) {
      throw new Error(
        "Todos los Client ID deben estar marcados como sintéticos.",
      );
    }
    if (!versionIds.has(credential.currentVersionId)) {
      throw new Error("Una credencial referencia una versión inexistente.");
    }
  }
  for (const version of versions) {
    if (!credentialIds.has(version.credentialId)) {
      throw new Error("Una versión referencia una credencial inexistente.");
    }
  }
  if (
    /clientSecret|password|\botp\b|deliveryUrl/i.test(JSON.stringify(fixture))
  ) {
    throw new Error("El fixture contiene material prohibido.");
  }
}

async function upsert(
  client: SeedClient,
  table: string,
  businessKey: string,
  desired: Array<Record<string, unknown>>,
) {
  const existing = await client.list(table);
  const byId = new Map(
    existing.map((record) => [
      String(record.fields[businessKey] ?? ""),
      record,
    ]),
  );
  if (byId.size !== existing.length || byId.has("")) {
    throw new Error(`${table} contiene identificadores vacíos o duplicados.`);
  }
  const creates = desired
    .filter((fields) => !byId.has(String(fields[businessKey])))
    .map((fields) => ({ fields }));
  const updates = desired
    .filter((fields) => byId.has(String(fields[businessKey])))
    .map((fields) => ({
      id: byId.get(String(fields[businessKey]))!.id,
      fields,
    }));
  await client.write(table, "POST", creates);
  await client.write(table, "PATCH", updates);
  const reloaded = await client.list(table);
  const ids = new Set(reloaded.map(({ fields }) => fields[businessKey]));
  if (desired.some((record) => !ids.has(record[businessKey]))) {
    throw new Error(`La verificación posterior de ${table} no coincide.`);
  }
}

const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/credentials.json", import.meta.url),
    "utf8",
  ),
) as CredentialFixture;
validateFixture(fixture);

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const confirmed = args.has("--confirm-seed=KeyOps");
if ((!dryRun && !confirmed) || (dryRun && confirmed)) {
  throw new Error("Uso: seed-credentials.ts --dry-run | --confirm-seed=KeyOps");
}
if (dryRun) {
  console.table({
    Credentials: fixture.credentials.length,
    CredentialVersions: fixture.versions.length,
  });
  console.log("Seed sintético válido; no se ha conectado con Airtable.");
  process.exit(0);
}

const baseId = process.env.AIRTABLE_BASE_ID;
const token = process.env.AIRTABLE_PAT;
if (!baseId || !token) {
  throw new Error("Faltan AIRTABLE_BASE_ID o AIRTABLE_PAT en worker/.env.");
}
let requests = 0;
const client = new SeedClient(baseId, token, async (...parameters) => {
  requests += 1;
  return fetch(...parameters);
});
await upsert(client, "Credentials", "credentialId", fixture.credentials);
await upsert(client, "CredentialVersions", "versionId", fixture.versions);

const applications = await client.list("Applications");
const byApplicationId = new Map(
  applications.map((record) => [
    String(record.fields.applicationId ?? ""),
    record,
  ]),
);
const applicationUpdates = fixture.credentials.map((credential) => {
  const application = byApplicationId.get(String(credential.applicationId));
  if (!application)
    throw new Error("El fixture referencia una aplicación inexistente.");
  return {
    id: application.id,
    fields: {
      currentCredentialId: credential.credentialId,
      credentialState: credential.state,
      lastChangedAt: credential.lastChangedAt,
      updatedAt: credential.lastChangedAt,
    },
  };
});
await client.write("Applications", "PATCH", applicationUpdates);
console.log(
  `Seed sintético idempotente verificado; ${requests} llamadas Airtable.`,
);
