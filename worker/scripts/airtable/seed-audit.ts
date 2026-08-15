import { readFile } from "node:fs/promises";

type SeedRecord = { id: string; fields: Record<string, unknown> };
type AuditFixture = {
  testRunId: string;
  events: Array<Record<string, unknown>>;
};

class AuditSeedClient {
  private readonly baseId: string;
  private readonly token: string;

  constructor(baseId: string, token: string) {
    this.baseId = baseId;
    this.token = token;
  }

  private url() {
    return `https://api.airtable.com/v0/${this.baseId}/AuditEvents`;
  }

  async list(): Promise<SeedRecord[]> {
    const records: SeedRecord[] = [];
    let offset: string | undefined;
    do {
      const url = new URL(this.url());
      url.searchParams.set("pageSize", "100");
      if (offset) url.searchParams.set("offset", offset);
      const response = await fetch(url, {
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

  async create(events: Array<Record<string, unknown>>) {
    for (let index = 0; index < events.length; index += 10) {
      const response = await fetch(this.url(), {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.token}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          records: events
            .slice(index, index + 10)
            .map((fields) => ({ fields })),
          typecast: true,
        }),
      });
      if (!response.ok)
        throw new Error(`Airtable rechazó la escritura (${response.status}).`);
    }
  }

  async remove(recordIds: string[]) {
    for (let index = 0; index < recordIds.length; index += 10) {
      const url = new URL(this.url());
      for (const id of recordIds.slice(index, index + 10))
        url.searchParams.append("records[]", id);
      const response = await fetch(url, {
        method: "DELETE",
        headers: { authorization: `Bearer ${this.token}` },
      });
      if (!response.ok)
        throw new Error(`Airtable rechazó la limpieza (${response.status}).`);
    }
  }
}

function validateFixture(fixture: AuditFixture) {
  if (!/^[A-Za-z0-9_-]{4,80}$/u.test(fixture.testRunId)) {
    throw new Error("El testRunId no es válido.");
  }
  const ids = fixture.events.map(({ eventId }) => eventId);
  if (
    new Set(ids).size !== ids.length ||
    ids.some((id) => typeof id !== "string")
  ) {
    throw new Error("Los eventId deben ser cadenas únicas.");
  }
  if (fixture.events.some(({ testRunId }) => testRunId !== fixture.testRunId)) {
    throw new Error(
      "Todos los eventos deben pertenecer al testRunId del fixture.",
    );
  }
  const serialized = JSON.stringify(fixture);
  if (
    /client.?secret|password|bearer|\botp\b|delivery.?url|stack/iu.test(
      serialized,
    )
  ) {
    throw new Error("El fixture contiene material prohibido.");
  }
  const results = new Set(fixture.events.map(({ result }) => result));
  if (
    !["succeeded", "failed", "rejected"].every((result) => results.has(result))
  ) {
    throw new Error("El fixture debe cubrir éxito, fallo y rechazo.");
  }
}

const fixture = JSON.parse(
  await readFile(
    new URL("./fixtures/audit-events.json", import.meta.url),
    "utf8",
  ),
) as AuditFixture;
validateFixture(fixture);

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const seed = args.has("--confirm-seed=KeyOps");
const cleanup = args.has("--cleanup") && args.has("--confirm-cleanup=KeyOps");
if ([dryRun, seed, cleanup].filter(Boolean).length !== 1) {
  throw new Error(
    "Uso: seed-audit.ts --dry-run | --confirm-seed=KeyOps | --cleanup --confirm-cleanup=KeyOps",
  );
}
if (dryRun) {
  console.table({
    AuditEvents: fixture.events.length,
    testRunId: fixture.testRunId,
  });
  console.log("Fixture de auditoría válido; no se ha conectado con Airtable.");
  process.exit(0);
}

const baseId = process.env.AIRTABLE_BASE_ID;
const token = process.env.AIRTABLE_PAT;
if (!baseId || !token)
  throw new Error("Faltan AIRTABLE_BASE_ID o AIRTABLE_PAT en worker/.env.");
const client = new AuditSeedClient(baseId, token);
const owned = (await client.list()).filter(
  ({ fields }) => fields.testRunId === fixture.testRunId,
);
await client.remove(owned.map(({ id }) => id));
if (cleanup) {
  console.log(
    `Limpieza limitada a ${owned.length} eventos de ${fixture.testRunId}.`,
  );
  process.exit(0);
}
await client.create(fixture.events);
const confirmed = (await client.list()).filter(
  ({ fields }) => fields.testRunId === fixture.testRunId,
);
if (confirmed.length !== fixture.events.length) {
  throw new Error("La verificación posterior de AuditEvents no coincide.");
}
console.log(
  `Seed de auditoría verificado: ${confirmed.length} eventos propios.`,
);
