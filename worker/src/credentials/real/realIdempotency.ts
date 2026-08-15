import { ApiError } from "../../http/ApiError";
import { sha256 } from "../syntheticDelivery";

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, stableValue(item)]),
    );
  }
  return value;
}

export function assertRealIdempotencyKey(key: string): void {
  if (!/^[A-Za-z0-9._:-]{16,200}$/u.test(key)) {
    throw new ApiError(
      400,
      "invalid_idempotency_key",
      "La clave idempotente no es válida.",
    );
  }
}

export function realRequestFingerprint(input: unknown): Promise<string> {
  return sha256(JSON.stringify(stableValue(input)));
}

export function realIdempotencyScopeHash(input: {
  userId: string;
  environment: "test" | "production";
  key: string;
}): Promise<string> {
  return sha256(`v2:${input.userId}:${input.environment}:${input.key}`);
}
