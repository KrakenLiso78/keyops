import { describe, expect, it, vi } from "vitest";
import { CatalogCache, catalogCacheKey } from "../../src/cache/catalogCache";

describe("corporate catalog cache", () => {
  it("segments actor, scope, environment and query", () => {
    expect(
      catalogCacheKey({
        actorUserId: "user-a",
        institutionScope: ["inst-b", "inst-a"],
        environment: "test",
        query: "pago",
      }),
    ).toBe(
      "actor=user-a&scope=inst-a%2Cinst-b&environment=test&query=pago&cursor=&contract=1",
    );
  });

  it("refreshes after at most sixty seconds and never serves expired data on failure", async () => {
    let now = 0;
    const cache = new CatalogCache(120_000, () => now);
    const load = vi.fn(async () => ({ version: 1 }));
    await expect(cache.getOrLoad("environment=test", load)).resolves.toEqual({
      version: 1,
    });
    now = 59_999;
    await cache.getOrLoad("environment=test", load);
    expect(load).toHaveBeenCalledTimes(1);
    now = 60_000;
    const unavailable = vi.fn(async () => {
      throw new Error("unavailable");
    });
    await expect(
      cache.getOrLoad("environment=test", unavailable),
    ).rejects.toThrow("unavailable");
  });
});
