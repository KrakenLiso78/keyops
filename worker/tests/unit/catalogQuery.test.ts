import { describe, expect, it, vi } from "vitest";
import { CatalogCache, catalogCacheKey } from "../../src/cache/catalogCache";
import { listCorporateApplications } from "../../src/applications/listCorporateApplications";
import type { CorporateCatalogPort } from "../../src/catalog/CorporateCatalogPort";
import type { AuthorizedUser } from "../../src/airtable/userSchema";
import fixture from "../fixtures/catalog/applications.json";
import { catalogPageSchema } from "../../src/catalog/catalogSchemas";

const user: AuthorizedUser = {
  id: "user-scoped",
  loginIdentifier: "scoped@example.invalid",
  displayName: "Scoped User",
  profile: "analyst",
  enabled: true,
  permissions: ["applications:read"],
  institutionIds: ["inst-salud"],
};

const emptyOperational = {
  contexts: {
    list: async () => [],
    get: async () => undefined,
    saveManagement: vi.fn(),
  },
  credentials: {
    listCredentials: async () => [],
    listVersions: async () => [],
  },
};

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

  it("applies environment and institution scope before returning catalog data", async () => {
    const base = catalogPageSchema.parse(fixture).items[0]!;
    const catalog: CorporateCatalogPort = {
      list: vi.fn(async () => ({
        items: [
          base,
          {
            ...base,
            externalApplicationId: "app-outside-scope",
            externalInstitutionId: "inst-other",
          },
          {
            ...base,
            externalApplicationId: "app-wrong-env",
            environment: "production" as const,
          },
        ],
      })),
      get: vi.fn(),
    };
    await expect(
      listCorporateApplications(
        user,
        {
          catalog,
          catalogCache: new CatalogCache(),
          ...emptyOperational,
        },
        { environment: "test", page: 1 },
      ),
    ).resolves.toMatchObject({
      total: 1,
      items: [{ id: "app-test", institution: { id: "inst-salud" } }],
    });
  });

  it("reflects a provider change only after the bounded cache expires", async () => {
    let now = 0;
    let name = "Pago en Línea";
    const base = catalogPageSchema.parse(fixture).items[0]!;
    const catalog: CorporateCatalogPort = {
      list: vi.fn(async () => ({ items: [{ ...base, name }] })),
      get: vi.fn(),
    };
    const dependencies = {
      catalog,
      catalogCache: new CatalogCache(60_000, () => now),
      ...emptyOperational,
    };
    const first = await listCorporateApplications(user, dependencies, {
      environment: "test",
    });
    name = "Pago Corporativo";
    const cached = await listCorporateApplications(user, dependencies, {
      environment: "test",
    });
    now = 60_000;
    const refreshed = await listCorporateApplications(user, dependencies, {
      environment: "test",
    });
    expect(first.items[0]!.name).toBe("Pago en Línea");
    expect(cached.items[0]!.name).toBe("Pago en Línea");
    expect(refreshed.items[0]!.name).toBe("Pago Corporativo");
  });
});
