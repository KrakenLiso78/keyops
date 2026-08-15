interface Entry<T> {
  value: T;
  expiresAt: number;
}

export class CatalogCache {
  private readonly entries = new Map<string, Entry<unknown>>();
  readonly ttlMs: number;

  constructor(
    ttlMs = 60_000,
    private readonly now: () => number = Date.now,
  ) {
    this.ttlMs = Math.min(Math.max(ttlMs, 0), 60_000);
  }

  async getOrLoad<T>(key: string, load: () => Promise<T>): Promise<T> {
    const current = this.entries.get(key) as Entry<T> | undefined;
    if (current && current.expiresAt > this.now()) return current.value;
    if (current) this.entries.delete(key);
    const value = await load();
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
    return value;
  }

  invalidateEnvironment(environment: "test" | "production") {
    for (const key of this.entries.keys()) {
      if (key.includes(`environment=${environment}`)) this.entries.delete(key);
    }
  }
}

export function catalogCacheKey(input: {
  actorUserId: string;
  institutionScope?: readonly string[];
  environment: "test" | "production";
  query?: string;
  cursor?: string;
  contractVersion?: string;
}) {
  return new URLSearchParams({
    actor: input.actorUserId,
    scope: [...(input.institutionScope ?? [])].sort().join(","),
    environment: input.environment,
    query: input.query ?? "",
    cursor: input.cursor ?? "",
    contract: input.contractVersion ?? "1",
  }).toString();
}
