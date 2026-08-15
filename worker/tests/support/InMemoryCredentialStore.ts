import type {
  AirtableClient,
  AirtableRecord,
} from "../../src/airtable/AirtableClient";

type SeedTables = Record<string, Array<Record<string, unknown>>>;
type Client = Pick<AirtableClient, "list" | "create" | "update" | "updateMany">;

export class InMemoryCredentialStore implements Client {
  private readonly tables = new Map<
    string,
    Array<AirtableRecord<Record<string, unknown>>>
  >();
  private sequence = 0;

  constructor(seed: SeedTables = {}) {
    for (const [table, records] of Object.entries(seed)) {
      this.tables.set(
        table,
        records.map((fields) => this.newRecord(table, structuredClone(fields))),
      );
    }
  }

  async list<TFields>(table: string): Promise<AirtableRecord<TFields>[]> {
    return structuredClone(
      this.tableRecords(table),
    ) as AirtableRecord<TFields>[];
  }

  async create<TFields>(
    table: string,
    fields: TFields,
  ): Promise<AirtableRecord<TFields>> {
    const record = this.newRecord(
      table,
      structuredClone(fields) as Record<string, unknown>,
    );
    this.tableRecords(table).push(record);
    return structuredClone(record) as AirtableRecord<TFields>;
  }

  async update<TFields>(
    table: string,
    recordId: string,
    fields: Partial<TFields>,
  ): Promise<AirtableRecord<TFields>> {
    const target = this.tableRecords(table).find(({ id }) => id === recordId);
    if (!target) throw new Error(`Unknown ${table} record ${recordId}`);
    Object.assign(target.fields, structuredClone(fields));
    return structuredClone(target) as AirtableRecord<TFields>;
  }

  async updateMany<TFields>(
    table: string,
    updates: Array<{ recordId: string; fields: Partial<TFields> }>,
  ): Promise<AirtableRecord<TFields>[]> {
    return Promise.all(
      updates.map(({ recordId, fields }) =>
        this.update<TFields>(table, recordId, fields),
      ),
    );
  }

  fields<TFields>(table: string): TFields[] {
    return structuredClone(
      this.tableRecords(table).map(({ fields }) => fields),
    ) as TFields[];
  }

  private tableRecords(
    table: string,
  ): Array<AirtableRecord<Record<string, unknown>>> {
    const existing = this.tables.get(table);
    if (existing) return existing;
    const created: Array<AirtableRecord<Record<string, unknown>>> = [];
    this.tables.set(table, created);
    return created;
  }

  private newRecord(
    table: string,
    fields: Record<string, unknown>,
  ): AirtableRecord<Record<string, unknown>> {
    this.sequence += 1;
    return {
      id: `rec-${table.toLowerCase()}-${this.sequence.toString().padStart(4, "0")}`,
      createdTime: "2026-08-15T10:00:00.000Z",
      fields,
    };
  }
}
