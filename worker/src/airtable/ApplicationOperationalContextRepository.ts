import { z } from "zod";
import type { AirtableClient, AirtableRecord } from "./AirtableClient";
import { environmentSchema, technicalContactSchema } from "./applicationSchema";
import { ApiError } from "../http/ApiError";

export const operationalContextFieldsSchema = z.object({
  contextId: z.string().min(1),
  catalogApplicationId: z.string().min(1),
  environment: environmentSchema,
  technicalContact: z.string().optional(),
  managementReason: z.string().max(500).optional(),
  requestOrTicketId: z.string().max(100).optional(),
  credentialReferenceId: z.string().min(1).optional(),
  declaredIps: z.string().default("[]"),
  updatedAt: z.string().datetime({ offset: true }),
});
export type OperationalContextFields = z.infer<
  typeof operationalContextFieldsSchema
>;

export interface PersistedOperationalContext {
  recordId: string;
  fields: OperationalContextFields;
}

type ContextClient = Pick<AirtableClient, "list" | "create" | "update">;

function parse(record: AirtableRecord<OperationalContextFields>) {
  return {
    recordId: record.id,
    fields: operationalContextFieldsSchema.parse(record.fields),
  };
}

export class ApplicationOperationalContextRepository {
  constructor(private readonly client: ContextClient) {}

  async list(): Promise<PersistedOperationalContext[]> {
    const contexts = (
      await this.client.list<OperationalContextFields>(
        "ApplicationOperationalContexts",
      )
    ).map(parse);
    const seen = new Set<string>();
    for (const context of contexts) {
      const key = `${context.fields.environment}:${context.fields.catalogApplicationId}`;
      if (seen.has(key)) {
        throw new ApiError(
          409,
          "duplicate_operational_context",
          "El contexto operativo está duplicado.",
        );
      }
      seen.add(key);
    }
    return contexts;
  }

  async get(
    environment: "test" | "production",
    catalogApplicationId: string,
  ): Promise<PersistedOperationalContext | undefined> {
    return (await this.list()).find(
      ({ fields }) =>
        fields.environment === environment &&
        fields.catalogApplicationId === catalogApplicationId,
    );
  }

  async saveManagement(input: {
    environment: "test" | "production";
    catalogApplicationId: string;
    expectedUpdatedAt: string;
    catalogUpdatedAt: string;
    technicalContact?: z.infer<typeof technicalContactSchema>;
    reason?: string;
    requestOrTicketId?: string;
    now?: string;
  }): Promise<PersistedOperationalContext> {
    const current = await this.get(
      input.environment,
      input.catalogApplicationId,
    );
    const currentVersion = current?.fields.updatedAt ?? input.catalogUpdatedAt;
    if (currentVersion !== input.expectedUpdatedAt) {
      throw new ApiError(
        409,
        "stale_application",
        "La aplicación ha cambiado; vuelve a cargarla.",
      );
    }
    const updatedAt = input.now ?? new Date().toISOString();
    const fields = operationalContextFieldsSchema.parse({
      ...(current?.fields ?? {}),
      contextId:
        current?.fields.contextId ??
        `ctx-${input.environment}-${input.catalogApplicationId}`,
      catalogApplicationId: input.catalogApplicationId,
      environment: input.environment,
      technicalContact: input.technicalContact
        ? JSON.stringify(input.technicalContact)
        : undefined,
      managementReason: input.reason,
      requestOrTicketId: input.requestOrTicketId,
      declaredIps: current?.fields.declaredIps ?? "[]",
      updatedAt,
    });
    return parse(
      current
        ? await this.client.update<OperationalContextFields>(
            "ApplicationOperationalContexts",
            current.recordId,
            fields,
          )
        : await this.client.create<OperationalContextFields>(
            "ApplicationOperationalContexts",
            fields,
          ),
    );
  }
}
