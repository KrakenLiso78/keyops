const encoder = new TextEncoder();

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

export async function complianceFingerprint(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(canonicalJson(value)),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function retentionUntilFor(occurredAt: string): string {
  const source = new Date(occurredAt);
  const year = source.getUTCFullYear() + 5;
  const month = source.getUTCMonth();
  const day = source.getUTCDate();
  source.setUTCDate(1);
  source.setUTCFullYear(year);
  source.setUTCMonth(month);
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  source.setUTCDate(Math.min(day, lastDay));
  return source.toISOString();
}
