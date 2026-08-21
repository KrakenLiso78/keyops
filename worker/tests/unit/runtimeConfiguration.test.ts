import { describe, expect, it, vi } from "vitest";
import type { AirtableClient } from "../../src/airtable/AirtableClient";
import { RuntimeConfigurationRepository } from "../../src/runtime/RuntimeConfigurationRepository";
import { RuntimeModeCache } from "../../src/runtime/RuntimeModeCache";

describe("runtime configuration", () => {
  it("uses the configured JSON document and persists a changed mode", async () => {
    const records: Array<{
      id: string;
      createdTime: string;
      fields: Record<string, unknown>;
    }> = [];
    const client = {
      list: vi.fn(async () => records),
      create: vi.fn(async (_table, fields) => {
        records.push({
          id: "rec-runtime",
          createdTime: "2026-08-21T09:00:00.000Z",
          fields,
        });
        return records[0];
      }),
      update: vi.fn(async (_table, id, fields) => {
        const record = records.find((candidate) => candidate.id === id);
        if (!record) throw new Error("Record not found");
        record.fields = fields;
        return record;
      }),
    } as unknown as Pick<AirtableClient, "create" | "list" | "update">;
    const repository = new RuntimeConfigurationRepository(client);

    await expect(repository.read("fake")).resolves.toBe("fake");
    await expect(
      repository.save("real", "2026-08-21T10:00:00.000Z"),
    ).resolves.toBe("real");
    await expect(repository.read("fake")).resolves.toBe("real");
    expect(client.create).toHaveBeenCalledWith(
      "RuntimeConfiguration",
      expect.objectContaining({ documentJson: '{"mode":"real"}' }),
    );
  });

  it("rejects malformed configuration instead of silently using fake mode", async () => {
    const client = {
      list: vi.fn(async () => [
        {
          id: "rec-runtime",
          createdTime: "2026-08-21T09:00:00.000Z",
          fields: {
            configurationId: "runtime",
            documentJson: '{"mode":"unsupported"}',
            updatedAt: "2026-08-21T09:00:00.000Z",
          },
        },
      ]),
      create: vi.fn(),
      update: vi.fn(),
    } as unknown as Pick<AirtableClient, "create" | "list" | "update">;

    await expect(
      new RuntimeConfigurationRepository(client).read("fake"),
    ).rejects.toMatchObject({
      status: 503,
      code: "invalid_runtime_configuration",
    });
  });

  it("caches the mode until an explicit reload", async () => {
    let now = 0;
    const cache = new RuntimeModeCache(60_000, () => now);
    const load = vi.fn(async () => "fake" as const);

    await cache.getOrLoad(load);
    await cache.getOrLoad(load);
    expect(load).toHaveBeenCalledTimes(1);

    cache.clear();
    await cache.getOrLoad(load);
    expect(load).toHaveBeenCalledTimes(2);
    now = 60_001;
    await cache.getOrLoad(load);
    expect(load).toHaveBeenCalledTimes(3);
  });
});
