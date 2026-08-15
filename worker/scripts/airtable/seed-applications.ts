import { airtableSeed } from "./seed-data.mjs";

type SeedRecord = { id: string; fields: Record<string, unknown> };

class SeedClient {
  private readonly baseId: string;
  private readonly token: string;
  private readonly fetcher: typeof fetch;

  constructor(options: {
    baseId: string;
    token: string;
    fetcher: typeof fetch;
  }) {
    this.baseId = options.baseId;
    this.token = options.token;
    this.fetcher = options.fetcher;
  }

  private url(table: string) {
    return `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(table)}`;
  }

  private async request(table: string, init: RequestInit = {}) {
    const response = await this.fetcher(this.url(table), {
      ...init,
      headers: {
        authorization: `Bearer ${this.token}`,
        "content-type": "application/json",
      },
    });
    if (!response.ok)
      throw new Error(`Airtable rechazó la operación (${response.status}).`);
    return (await response.json()) as {
      records: SeedRecord[];
      offset?: string;
    };
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

  async createMany(table: string, records: Array<Record<string, unknown>>) {
    for (let index = 0; index < records.length; index += 10) {
      const batch = records.slice(index, index + 10);
      if (batch.length) {
        await this.request(table, {
          method: "POST",
          body: JSON.stringify({
            records: batch.map((fields) => ({ fields })),
            typecast: true,
          }),
        });
      }
    }
  }

  async updateMany(
    table: string,
    updates: Array<{ recordId: string; fields: Record<string, unknown> }>,
  ) {
    for (let index = 0; index < updates.length; index += 10) {
      const batch = updates.slice(index, index + 10);
      if (batch.length) {
        await this.request(table, {
          method: "PATCH",
          body: JSON.stringify({
            records: batch.map(({ recordId: id, fields }) => ({ id, fields })),
            typecast: true,
          }),
        });
      }
    }
  }
}

const TABLES = [
  { name: "Institutions", key: "institutionId" },
  { name: "ApiRoles", key: "roleId" },
  { name: "Applications", key: "applicationId" },
] as const;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const confirmed = args.has("--confirm-seed=KeyOps");

if ((!dryRun && !confirmed) || (dryRun && confirmed)) {
  throw new Error(
    "Uso: seed-applications.ts --dry-run | --confirm-seed=KeyOps",
  );
}

if (dryRun) {
  console.table(
    Object.fromEntries(
      TABLES.map(({ name }) => [name, airtableSeed[name].length]),
    ),
  );
  console.log("Seed válido; no se ha conectado con Airtable.");
  process.exit(0);
}

const baseId = process.env.AIRTABLE_BASE_ID;
const token = process.env.AIRTABLE_PAT;
if (!baseId || !token) {
  throw new Error("Faltan AIRTABLE_BASE_ID o AIRTABLE_PAT en worker/.env.");
}

let requests = 0;
const client = new SeedClient({
  baseId,
  token,
  fetcher: async (...parameters) => {
    requests += 1;
    return fetch(...parameters);
  },
});

for (const { name, key } of TABLES) {
  const desired = airtableSeed[name] as Array<Record<string, unknown>>;
  const existing = await client.list(name);
  const byBusinessId = new Map<string, (typeof existing)[number]>();
  for (const record of existing) {
    const businessId = String(record.fields[key] ?? "");
    if (!businessId || byBusinessId.has(businessId)) {
      throw new Error(`${name} contiene un identificador vacío o duplicado.`);
    }
    byBusinessId.set(businessId, record);
  }

  const updates = desired
    .filter((fields) => byBusinessId.has(String(fields[key])))
    .map((fields) => ({
      recordId: byBusinessId.get(String(fields[key]))!.id,
      fields,
    }));
  const creates = desired.filter(
    (fields) => !byBusinessId.has(String(fields[key])),
  );
  await client.updateMany(name, updates);
  await client.createMany(name, creates);

  const reloaded = await client.list(name);
  const reloadedIds = new Set(
    reloaded.map((record) => String(record.fields[key] ?? "")),
  );
  if (desired.some((fields) => !reloadedIds.has(String(fields[key])))) {
    throw new Error(
      `La verificación posterior de ${name} no coincide con el seed.`,
    );
  }
}

console.log(`Seed idempotente verificado; ${requests} llamadas Airtable.`);
