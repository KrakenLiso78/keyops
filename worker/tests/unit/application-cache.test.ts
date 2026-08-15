import { describe, expect, it } from "vitest";
import {
  ApplicationCache,
  applicationCacheKey,
} from "../../src/cache/applicationCache";

describe("application cache", () => {
  it("isolates user, scope, environment and query and expires entries", () => {
    let now = 1_000;
    const cache = new ApplicationCache(100, () => now);
    const key = applicationCacheKey({
      userId: "user-1",
      permissionScope: "applications:read",
      environment: "test",
      query: "pago",
    });
    cache.set(key, { total: 1 });
    expect(cache.get(key)).toEqual({ total: 1 });
    expect(key).not.toBe(
      applicationCacheKey({
        userId: "user-2",
        permissionScope: "applications:read",
        environment: "test",
        query: "pago",
      }),
    );
    now = 1_101;
    expect(cache.get(key)).toBeUndefined();
  });

  it("invalidates only the changed environment", () => {
    const cache = new ApplicationCache();
    const testKey = "v1|user|scope|test|query";
    const productionKey = "v1|user|scope|production|query";
    cache.set(testKey, 1);
    cache.set(productionKey, 2);
    cache.invalidateEnvironment("test");
    expect(cache.get(testKey)).toBeUndefined();
    expect(cache.get(productionKey)).toBe(2);
  });
});
