const sensitive = /authorization|otp|deliveryurl|clientsecret|password|refreshToken|accessToken/i;
export function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sensitive.test(key) ? '[REDACTED]' : redact(item),
      ]),
    );
  return value;
}
