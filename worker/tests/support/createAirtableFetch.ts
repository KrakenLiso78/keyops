import type { InMemoryCredentialStore } from "./InMemoryCredentialStore";
import catalogFixture from "../fixtures/catalog/applications.json";

export function createAirtableFetch(
  store: InMemoryCredentialStore,
): typeof fetch {
  return async (input, init = {}) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input
          : input.url,
    );
    const table = decodeURIComponent(url.pathname.split("/").at(-1) ?? "");
    if (url.hostname === "catalog.test") {
      const environment = url.searchParams.get("environment");
      const match = url.pathname.match(/^\/applications\/([^/]+)$/u);
      if (match) {
        const item = catalogFixture.items.find(
          (candidate) =>
            candidate.externalApplicationId === decodeURIComponent(match[1]!) &&
            candidate.environment === environment,
        );
        return item
          ? Response.json(item)
          : Response.json({ code: "not_found" }, { status: 404 });
      }
      return Response.json({
        items: catalogFixture.items.filter(
          (candidate) => candidate.environment === environment,
        ),
      });
    }
    const method = init.method ?? "GET";
    if (method === "POST") {
      const body = JSON.parse(String(init.body)) as {
        records: Array<{ fields: Record<string, unknown> }>;
      };
      return Response.json({
        records: await Promise.all(
          body.records.map(({ fields }) => store.create(table, fields)),
        ),
      });
    }
    if (method === "PATCH") {
      const body = JSON.parse(String(init.body)) as {
        records: Array<{ id: string; fields: Record<string, unknown> }>;
      };
      return Response.json({
        records: await Promise.all(
          body.records.map(({ id, fields }) => store.update(table, id, fields)),
        ),
      });
    }
    let records = await store.list<Record<string, unknown>>(table);
    const formula = url.searchParams.get("filterByFormula") ?? "";
    const userId = formula.match(/\{userId\}='([^']+)'/u)?.[1];
    const login = formula.match(/LOWER\(\{loginIdentifier\}\)='([^']+)'/u)?.[1];
    const eventId = formula.match(/\{eventId\}='([^']+)'/u)?.[1];
    if (userId)
      records = records.filter(({ fields }) => fields.userId === userId);
    if (login)
      records = records.filter(
        ({ fields }) => fields.loginIdentifier === login,
      );
    if (eventId)
      records = records.filter(({ fields }) => fields.eventId === eventId);
    return Response.json({ records });
  };
}
