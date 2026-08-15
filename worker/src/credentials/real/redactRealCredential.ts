const secretKeys = new Set([
  "clientsecret",
  "secret",
  "password",
  "zippassword",
  "otp",
  "onetimepassword",
  "deliveryurl",
  "downloadurl",
  "artifact",
  "zip",
]);

export function redactRealCredential(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactRealCredential);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(
        ([key]) => !secretKeys.has(key.replace(/[^a-z]/giu, "").toLowerCase()),
      )
      .map(([key, item]) => [key, redactRealCredential(item)]),
  );
}

export function containsForbiddenSecretKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsForbiddenSecretKey);
  if (!value || typeof value !== "object") return false;
  return Object.entries(value as Record<string, unknown>).some(
    ([key, item]) =>
      secretKeys.has(key.replace(/[^a-z]/giu, "").toLowerCase()) ||
      containsForbiddenSecretKey(item),
  );
}
