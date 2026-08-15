interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface ApplicationCacheKey {
  userId: string;
  permissionScope: string;
  environment: string;
  query: string;
}

export function applicationCacheKey(key: ApplicationCacheKey): string {
  return [
    "v1",
    key.userId,
    key.permissionScope,
    key.environment,
    key.query,
  ].join("|");
}

export class ApplicationCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  constructor(
    private readonly ttlMs = 5_000,
    private readonly now: () => number = Date.now,
  ) {}

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    this.entries.set(key, { value, expiresAt: this.now() + this.ttlMs });
  }

  invalidateEnvironment(environment: string): void {
    for (const key of this.entries.keys()) {
      if (key.split("|")[3] === environment) this.entries.delete(key);
    }
  }

  clear(): void {
    this.entries.clear();
  }
}
