export class RuntimeModeCache {
  private current?: { mode: "fake" | "real"; expiresAt: number };

  constructor(
    private readonly ttlMs = 60_000,
    private readonly now: () => number = Date.now,
  ) {}

  async getOrLoad(load: () => Promise<"fake" | "real">) {
    if (this.current && this.current.expiresAt > this.now())
      return this.current.mode;
    const mode = await load();
    this.current = { mode, expiresAt: this.now() + this.ttlMs };
    return mode;
  }

  clear() {
    this.current = undefined;
  }
}
