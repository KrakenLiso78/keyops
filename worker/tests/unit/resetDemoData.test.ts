import { describe, expect, it, vi } from "vitest";
import { resetDemoData } from "../../src/fake/resetDemoData";
import type { AirtableClient } from "../../src/airtable/AirtableClient";

describe("reset demo data", () => {
  it("clears persisted operational data before loading the canonical seed", async () => {
    const client = {
      list: vi.fn(async () => []),
      deleteMany: vi.fn(async () => undefined),
      createMany: vi.fn(async () => []),
    } as unknown as Pick<AirtableClient, "createMany" | "deleteMany" | "list">;

    await expect(resetDemoData(client)).resolves.toMatchObject({
      Users: 4,
      Applications: 24,
      Credentials: 6,
      CredentialVersions: 7,
      AuditEvents: 0,
    });
    expect(client.list).toHaveBeenCalledWith("ApplicationOperationalContexts");
    expect(client.deleteMany).toHaveBeenCalledWith(
      "ApplicationOperationalContexts",
      [],
    );
    expect(client.createMany).toHaveBeenCalledWith(
      "Applications",
      expect.arrayContaining([
        expect.objectContaining({
          applicationId: "app-002",
          credentialState: "active",
          currentCredentialId: "cred-app-002-test",
        }),
      ]),
    );
    expect(client.createMany).toHaveBeenCalledWith(
      "Credentials",
      expect.arrayContaining([
        expect.objectContaining({
          credentialId: "cred-app-002-test",
          applicationId: "app-002",
        }),
      ]),
    );
  });

  it("preserves audit records tagged as real", async () => {
    const client = {
      list: vi.fn(async (table: string) =>
        table === "AuditEvents"
          ? [
              { id: "fake-audit", fields: { mode: "fake" } },
              { id: "real-audit", fields: { mode: "real" } },
            ]
          : [],
      ),
      deleteMany: vi.fn(async () => undefined),
      createMany: vi.fn(async () => []),
    } as unknown as Pick<AirtableClient, "createMany" | "deleteMany" | "list">;

    await resetDemoData(client);

    expect(client.deleteMany).toHaveBeenCalledWith("AuditEvents", [
      "fake-audit",
    ]);
  });
});
