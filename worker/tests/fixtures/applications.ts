import type { AirtableRecord } from "../../src/airtable/AirtableClient";
import type {
  ApiRoleFields,
  ApplicationFields,
  InstitutionFields,
} from "../../src/airtable/applicationSchema";

const createdTime = "2026-08-15T09:00:00.000Z";

export const institutionRecords: AirtableRecord<InstitutionFields>[] = [
  {
    id: "rec-inst-1",
    createdTime,
    fields: {
      institutionId: "inst-salud",
      name: "Ministerio de Salud",
      searchName: "ministerio de salud",
    },
  },
  {
    id: "rec-inst-2",
    createdTime,
    fields: {
      institutionId: "inst-hacienda",
      name: "Ministerio de Hacienda",
      searchName: "ministerio de hacienda",
    },
  },
];

export const roleRecords: AirtableRecord<ApiRoleFields>[] = [
  {
    id: "rec-role-1",
    createdTime,
    fields: {
      roleId: "role-mensajes",
      name: "Envío de mensajes",
      serviceIdentifiers: ["mensajeria"],
    },
  },
];

export const applicationRecords: AirtableRecord<ApplicationFields>[] = [
  {
    id: "rec-app-1",
    createdTime,
    fields: {
      applicationId: "app-test",
      name: "Pago en Línea",
      searchName: "pago en linea",
      institutionId: "inst-salud",
      environment: "test",
      roleId: "role-mensajes",
      declaredIps: '["10.1.2.3"]',
      technicalContact:
        '{"displayName":"Ángela Ruiz","email":"angela@example.invalid"}',
      managementReason: "Alta inicial",
      requestOrTicketId: "SOL-101",
      credentialState: "active",
      lastChangedAt: "2026-08-15T09:00:00.000Z",
      updatedAt: "2026-08-15T09:00:00.000Z",
    },
  },
  {
    id: "rec-app-2",
    createdTime,
    fields: {
      applicationId: "app-production",
      name: "Portal Tributario",
      searchName: "portal tributario",
      institutionId: "inst-hacienda",
      environment: "production",
      roleId: "role-mensajes",
      declaredIps: "[]",
      credentialState: "revoked",
      lastChangedAt: "2026-08-14T09:00:00.000Z",
      updatedAt: "2026-08-14T09:00:00.000Z",
    },
  },
];

export const providerErrors = {
  rateLimited: { status: 429, code: "provider_rate_limited" },
  unavailable: { status: 503, code: "provider_unavailable" },
  conflict: { status: 409, code: "stale_application" },
} as const;

export function createApplicationAirtableFetch(
  users: Array<Record<string, unknown>>,
) {
  const applications = structuredClone(applicationRecords);
  const tables: Record<
    string,
    Array<{ id: string; createdTime: string; fields: Record<string, unknown> }>
  > = {
    Users: users.map((fields, index) => ({
      id: `rec-user-${index}`,
      createdTime,
      fields,
    })),
    Institutions: structuredClone(institutionRecords),
    ApiRoles: structuredClone(roleRecords),
    Applications: applications,
    AuditEvents: [],
  };

  return async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input
          : input.url,
    );
    const table = decodeURIComponent(url.pathname.split("/").at(-1) ?? "");
    let records = tables[table] ?? [];
    const formula = url.searchParams.get("filterByFormula") ?? "";
    const userId = formula.match(/\{userId\}='([^']+)'/u)?.[1];
    const eventId = formula.match(/\{eventId\}='([^']+)'/u)?.[1];
    if (userId)
      records = records.filter(({ fields }) => fields.userId === userId);
    if (eventId)
      records = records.filter(({ fields }) => fields.eventId === eventId);

    if ((init?.method ?? "GET") === "POST") {
      const body = JSON.parse(String(init?.body)) as {
        records: Array<{ fields: Record<string, unknown> }>;
      };
      const created = body.records.map(({ fields }, index) => ({
        id: `rec-${table.toLowerCase()}-${(tables[table]?.length ?? 0) + index + 1}`,
        createdTime,
        fields,
      }));
      (tables[table] ??= []).push(...created);
      return Response.json({ records: created });
    }

    if ((init?.method ?? "GET") === "PATCH") {
      const body = JSON.parse(String(init?.body)) as {
        records: Array<{ id: string; fields: Record<string, unknown> }>;
      };
      const updated = body.records.map((update) => {
        const target = records.find(({ id }) => id === update.id);
        if (!target) throw new Error("Unknown fixture record");
        Object.assign(target.fields, update.fields);
        return target;
      });
      return Response.json({ records: updated });
    }
    return Response.json({ records });
  };
}
