import { z } from "zod";
import type {
  AirtableClient,
  AirtableRecord,
} from "../airtable/AirtableClient";
import { ApiError } from "../http/ApiError";

const configurationId = "runtime";
const documentSchema = z.object({ mode: z.enum(["fake", "real"]) }).strict();
const fieldsSchema = z.object({
  configurationId: z.literal(configurationId),
  documentJson: z.string().min(1),
  updatedAt: z.string().datetime({ offset: true }),
});
type RuntimeConfigurationFields = z.infer<typeof fieldsSchema>;
type Client = Pick<AirtableClient, "create" | "list" | "update">;

function parseDocument(documentJson: string) {
  try {
    return documentSchema.parse(JSON.parse(documentJson));
  } catch {
    throw new ApiError(
      503,
      "invalid_runtime_configuration",
      "La configuración de ejecución no contiene un JSON válido.",
    );
  }
}

export class RuntimeConfigurationRepository {
  constructor(private readonly client: Client) {}

  async read(fallbackMode: "fake" | "real") {
    const record = (await this.records())[0];
    return record
      ? parseDocument(record.fields.documentJson).mode
      : fallbackMode;
  }

  async save(mode: "fake" | "real", now = new Date().toISOString()) {
    const current = (await this.records())[0];
    const fields: RuntimeConfigurationFields = {
      configurationId,
      documentJson: JSON.stringify({ mode }),
      updatedAt: now,
    };
    if (current) {
      await this.client.update("RuntimeConfiguration", current.id, fields);
    } else {
      await this.client.create("RuntimeConfiguration", fields);
    }
    return mode;
  }

  private async records(): Promise<
    AirtableRecord<RuntimeConfigurationFields>[]
  > {
    const records = (
      await this.client.list<Record<string, unknown>>("RuntimeConfiguration")
    )
      .filter((record) => record.fields.configurationId === configurationId)
      .map((record) => ({
        ...record,
        fields: fieldsSchema.parse(record.fields),
      }));
    if (records.length > 1) {
      throw new ApiError(
        409,
        "duplicate_runtime_configuration",
        "La configuración de ejecución está duplicada.",
      );
    }
    return records;
  }
}
