import type { AirtableRecord } from "../../src/airtable/AirtableClient";
import type { UserFields } from "../../src/airtable/userSchema";

export class InMemoryAirtable {
  readonly records: AirtableRecord<UserFields>[];

  constructor(users: UserFields[]) {
    this.records = users.map((fields, index) => ({
      id: `rec-user-${index + 1}`,
      createdTime: "2026-08-15T09:00:00.000Z",
      fields,
    }));
  }

  readonly fetch: typeof fetch = async (input) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input
          : input.url,
    );
    const formula = url.searchParams.get("filterByFormula");
    let records = this.records;
    if (formula) {
      const userId = formula.match(/\{userId\}='([^']+)'/u)?.[1];
      const login =
        formula.match(/LOWER\(\{loginIdentifier\}\\?\)='([^']+)'/u)?.[1] ??
        formula.match(/LOWER\(\{loginIdentifier\}\)='([^']+)'/u)?.[1];
      if (userId)
        records = records.filter((record) => record.fields.userId === userId);
      if (login)
        records = records.filter(
          (record) => record.fields.loginIdentifier === login,
        );
    }
    return Response.json({ records });
  };
}
