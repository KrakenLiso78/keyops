import { airtableSeed, DELETE_ORDER, TABLE_NAMES } from "./seed-data.mjs";

const BATCH_SIZE = 10;
const MIN_REQUEST_INTERVAL_MS = 220;
const MAX_RETRIES = 4;

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const confirmed = args.has("--confirm-reset=KeyOps");
const allowedArgs = new Set(["--dry-run", "--confirm-reset=KeyOps"]);
const unknownArgs = [...args].filter((arg) => !allowedArgs.has(arg));

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (unknownArgs.length > 0 || (dryRun && confirmed)) {
  fail("Uso: reset-base.mjs --dry-run | reset-base.mjs --confirm-reset=KeyOps");
}

const expectedCounts = Object.fromEntries(
  TABLE_NAMES.map((tableName) => [tableName, airtableSeed[tableName].length]),
);

if (dryRun) {
  console.log("Seed válido. Plan de reseteo de KeyOps:");
  console.table(expectedCounts);
  console.log(
    "No se ha conectado con Airtable ni se ha modificado ningún dato.",
  );
  process.exit(0);
}

if (!confirmed) {
  fail(
    "Operación destructiva no confirmada. Ejecuta npm run airtable:reset -- --confirm-reset=KeyOps",
  );
}

const token = process.env.AIRTABLE_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID;

if (!token) fail("Falta AIRTABLE_TOKEN en worker/.env o en el entorno.");
if (!/^app[A-Za-z0-9]{14}$/.test(baseId ?? "")) {
  fail(
    "AIRTABLE_BASE_ID no tiene el formato esperado de una base de Airtable.",
  );
}

const delay = (milliseconds) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

function chunks(items, size = BATCH_SIZE) {
  const result = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

class AirtableClient {
  #lastRequestAt = 0;

  constructor({ baseId: configuredBaseId, token: configuredToken }) {
    this.baseId = configuredBaseId;
    this.token = configuredToken;
  }

  tableUrl(tableName) {
    return `https://api.airtable.com/v0/${this.baseId}/${encodeURIComponent(tableName)}`;
  }

  async request(url, options = {}, attempt = 0) {
    const elapsed = Date.now() - this.#lastRequestAt;
    if (elapsed < MIN_REQUEST_INTERVAL_MS)
      await delay(MIN_REQUEST_INTERVAL_MS - elapsed);

    this.#lastRequestAt = Date.now();
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (
      (response.status === 429 || response.status >= 500) &&
      attempt < MAX_RETRIES
    ) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const waitMilliseconds =
        response.status === 429
          ? Math.max(
              Number.isFinite(retryAfter) ? retryAfter * 1000 : 0,
              30_000,
            )
          : 500 * 2 ** attempt;
      await delay(waitMilliseconds);
      return this.request(url, options, attempt + 1);
    }

    const text = await response.text();
    let payload = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { error: { message: text.slice(0, 300) } };
    }
    if (!response.ok) {
      const detail =
        payload?.error?.message ?? payload?.error?.type ?? response.statusText;
      throw new Error(`Airtable ${response.status}: ${detail}`);
    }
    return payload;
  }

  async listRecordIds(tableName) {
    const ids = [];
    let offset;
    do {
      const url = new URL(this.tableUrl(tableName));
      url.searchParams.set("pageSize", "100");
      if (offset) url.searchParams.set("offset", offset);
      const page = await this.request(url);
      ids.push(...page.records.map((record) => record.id));
      offset = page.offset;
    } while (offset);
    return ids;
  }

  async deleteRecords(tableName, recordIds) {
    for (const batch of chunks(recordIds)) {
      const url = new URL(this.tableUrl(tableName));
      for (const recordId of batch)
        url.searchParams.append("records[]", recordId);
      await this.request(url, { method: "DELETE" });
    }
  }

  async createRecords(tableName, records) {
    for (const batch of chunks(records)) {
      await this.request(this.tableUrl(tableName), {
        method: "POST",
        body: JSON.stringify({
          records: batch.map((fields) => ({ fields })),
          typecast: true,
        }),
      });
    }
  }
}

const client = new AirtableClient({ baseId, token });

async function resetBase() {
  console.log(`Preparando el reseteo de ${baseId}...`);

  // Se capturan todos los IDs antes de borrar. Así, una tabla inexistente o sin acceso
  // detiene la operación antes de la primera modificación.
  const existingRecordIds = {};
  for (const tableName of TABLE_NAMES) {
    existingRecordIds[tableName] = await client.listRecordIds(tableName);
  }

  for (const tableName of DELETE_ORDER) {
    const recordIds = existingRecordIds[tableName];
    await client.deleteRecords(tableName, recordIds);
    console.log(`Vaciada ${tableName}: ${recordIds.length} registros.`);
  }

  for (const tableName of TABLE_NAMES) {
    const records = airtableSeed[tableName];
    await client.createRecords(tableName, records);
    console.log(`Cargada ${tableName}: ${records.length} registros.`);
  }

  const actualCounts = {};
  for (const tableName of TABLE_NAMES) {
    actualCounts[tableName] = (await client.listRecordIds(tableName)).length;
  }

  const mismatches = TABLE_NAMES.filter(
    (tableName) => actualCounts[tableName] !== expectedCounts[tableName],
  );
  if (mismatches.length > 0) {
    throw new Error(
      `El recuento final no coincide en: ${mismatches.join(", ")}.`,
    );
  }

  console.table(actualCounts);
  console.log("Base KeyOps restablecida y verificada.");
}

try {
  await resetBase();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  console.error(
    "El reseteo puede haber quedado parcial; vuelve a ejecutar el mismo comando.",
  );
  process.exitCode = 1;
}
