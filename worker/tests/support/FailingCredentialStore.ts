import type {
  AirtableClient,
  AirtableRecord,
} from "../../src/airtable/AirtableClient";
import { ApiError } from "../../src/http/ApiError";

type Store = Pick<AirtableClient, "list" | "create" | "update" | "updateMany">;

export class FailingCredentialStore {
  private writes = 0;

  constructor(
    private readonly delegate: Store,
    private readonly failOnWrite: number,
  ) {}

  list<TFields>(table: string, params?: Record<string, string>) {
    return this.delegate.list<TFields>(table, params);
  }

  async create<TFields>(
    table: string,
    fields: TFields,
  ): Promise<AirtableRecord<TFields>> {
    this.beforeWrite();
    return this.delegate.create<TFields>(table, fields);
  }

  async update<TFields>(
    table: string,
    recordId: string,
    fields: Partial<TFields>,
  ): Promise<AirtableRecord<TFields>> {
    this.beforeWrite();
    return this.delegate.update<TFields>(table, recordId, fields);
  }

  async updateMany<TFields>(
    table: string,
    updates: Array<{ recordId: string; fields: Partial<TFields> }>,
  ): Promise<AirtableRecord<TFields>[]> {
    this.beforeWrite();
    return this.delegate.updateMany<TFields>(table, updates);
  }

  private beforeWrite() {
    this.writes += 1;
    if (this.writes === this.failOnWrite) {
      throw new ApiError(
        503,
        "simulated_provider_failure",
        "Fallo de persistencia simulado.",
        true,
      );
    }
  }
}
