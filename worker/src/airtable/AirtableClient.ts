import { ApiError } from "../http/ApiError";

export interface AirtableRecord<TFields> {
  id: string;
  createdTime: string;
  fields: TFields;
}

interface AirtablePage<TFields> {
  records: AirtableRecord<TFields>[];
  offset?: string;
}

interface AirtableErrorPayload {
  error?: { type?: string; message?: string } | string;
}

export interface AirtableClientOptions {
  baseId: string;
  token: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
}

export class AirtableClient {
  private readonly fetcher: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(private readonly options: AirtableClientOptions) {
    this.fetcher = options.fetcher ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 8_000;
    this.maxRetries = options.maxRetries ?? 3;
  }

  async list<TFields>(
    table: string,
    params: Record<string, string> = {},
  ): Promise<AirtableRecord<TFields>[]> {
    const records: AirtableRecord<TFields>[] = [];
    let offset: string | undefined;
    do {
      const url = new URL(this.tableUrl(table));
      url.searchParams.set("pageSize", "100");
      Object.entries(params).forEach(([key, value]) =>
        url.searchParams.set(key, value),
      );
      if (offset) url.searchParams.set("offset", offset);
      const page = await this.request<AirtablePage<TFields>>(url, {
        method: "GET",
      });
      records.push(...page.records);
      offset = page.offset;
    } while (offset);
    return records;
  }

  async create<TFields>(
    table: string,
    fields: TFields,
  ): Promise<AirtableRecord<TFields>> {
    const record = (await this.createMany(table, [fields]))[0];
    if (!record)
      throw new ApiError(
        503,
        "provider_invalid_response",
        "El proveedor devolvió una respuesta inválida.",
        true,
      );
    return record;
  }

  async createMany<TFields>(
    table: string,
    fieldsList: TFields[],
  ): Promise<AirtableRecord<TFields>[]> {
    const created: AirtableRecord<TFields>[] = [];
    for (let index = 0; index < fieldsList.length; index += 10) {
      const batch = fieldsList.slice(index, index + 10);
      const response = await this.request<{
        records: AirtableRecord<TFields>[];
      }>(this.tableUrl(table), {
        method: "POST",
        body: JSON.stringify({
          records: batch.map((fields) => ({ fields })),
          typecast: true,
        }),
      });
      created.push(...response.records);
    }
    return created;
  }

  async update<TFields>(
    table: string,
    recordId: string,
    fields: Partial<TFields>,
  ): Promise<AirtableRecord<TFields>> {
    const response = await this.request<{ records: AirtableRecord<TFields>[] }>(
      this.tableUrl(table),
      {
        method: "PATCH",
        body: JSON.stringify({
          records: [{ id: recordId, fields }],
          typecast: true,
        }),
      },
    );
    const record = response.records[0];
    if (!record)
      throw new ApiError(
        503,
        "provider_invalid_response",
        "El proveedor devolvió una respuesta inválida.",
        true,
      );
    return record;
  }

  async updateMany<TFields>(
    table: string,
    updates: Array<{ recordId: string; fields: Partial<TFields> }>,
  ): Promise<AirtableRecord<TFields>[]> {
    const updated: AirtableRecord<TFields>[] = [];
    for (let index = 0; index < updates.length; index += 10) {
      const batch = updates.slice(index, index + 10);
      const response = await this.request<{
        records: AirtableRecord<TFields>[];
      }>(this.tableUrl(table), {
        method: "PATCH",
        body: JSON.stringify({
          records: batch.map(({ recordId, fields }) => ({
            id: recordId,
            fields,
          })),
          typecast: true,
        }),
      });
      updated.push(...response.records);
    }
    return updated;
  }

  async upsert<TFields>(
    table: string,
    fields: TFields,
    fieldsToMergeOn: string[],
  ): Promise<AirtableRecord<TFields>> {
    const response = await this.request<{ records: AirtableRecord<TFields>[] }>(
      this.tableUrl(table),
      {
        method: "PATCH",
        body: JSON.stringify({
          performUpsert: { fieldsToMergeOn },
          records: [{ fields }],
          typecast: true,
        }),
      },
    );
    const record = response.records[0];
    if (!record) {
      throw new ApiError(
        503,
        "provider_invalid_response",
        "El proveedor devolvió una respuesta inválida.",
        true,
      );
    }
    return record;
  }

  private tableUrl(table: string): string {
    return `https://api.airtable.com/v0/${this.options.baseId}/${encodeURIComponent(table)}`;
  }

  private async request<T>(
    url: string | URL,
    init: RequestInit,
    attempt = 0,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(url, {
        ...init,
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${this.options.token}`,
          "content-type": "application/json",
          ...init.headers,
        },
      });
      if (
        (response.status === 429 || response.status >= 500) &&
        attempt < this.maxRetries
      ) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(retryAfter * 1_000, 100 * 2 ** attempt)),
        );
        return this.request<T>(url, init, attempt + 1);
      }
      if (!response.ok) {
        const payload = (await response
          .json()
          .catch(() => ({}))) as AirtableErrorPayload;
        const providerCode =
          typeof payload.error === "object"
            ? payload.error?.type
            : payload.error;
        console.error("airtable_request_failed", {
          status: response.status,
          providerCode,
        });
        throw new ApiError(
          response.status === 429 ? 429 : 503,
          response.status === 429
            ? "provider_rate_limited"
            : "provider_unavailable",
          providerCode === "NOT_FOUND"
            ? "No se encontró el recurso solicitado."
            : "El servicio de persistencia no está disponible.",
          true,
        );
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        503,
        "provider_unavailable",
        "El servicio de persistencia no está disponible.",
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
