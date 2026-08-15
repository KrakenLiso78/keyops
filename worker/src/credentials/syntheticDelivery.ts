export const SYNTHETIC_CLASSIFICATION = "SYNTHETIC-NON-FUNCTIONAL" as const;
export const DELIVERY_TTL_MS = 120_000;

const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

export async function sha256(value: string): Promise<string> {
  return bytesToHex(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", encoder.encode(value)),
    ),
  );
}

export async function hmacDigest(
  secret: string,
  value: string,
): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await importHmacKey(secret),
    encoder.encode(value),
  );
  return bytesToHex(new Uint8Array(signature));
}

export async function deriveOneTimeCode(
  pepper: string,
  deliveryId: string,
): Promise<string> {
  const digest = await hmacDigest(pepper, `otp:${deliveryId}`);
  const value = Number.parseInt(digest.slice(0, 12), 16) % 1_000_000;
  return value.toString().padStart(6, "0");
}

export async function deliveryCodeDigest(
  pepper: string,
  deliveryId: string,
  code: string,
): Promise<string> {
  return hmacDigest(pepper, `${deliveryId}:${code}`);
}

export function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |=
      (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export function syntheticClientId(
  environment: "test" | "production",
  applicationId: string,
  credentialId: string,
): string {
  const compact = `${applicationId}_${credentialId}`.replace(
    /[^A-Za-z0-9_]/gu,
    "_",
  );
  return `synthetic_${environment}_${compact}`;
}

export interface SyntheticArtifact {
  classification: typeof SYNTHETIC_CLASSIFICATION;
  applicationId: string;
  credentialVersionId: string;
  generatedAt: string;
}

export function createSyntheticArtifact(
  applicationId: string,
  credentialVersionId: string,
  generatedAt = new Date().toISOString(),
): SyntheticArtifact {
  return {
    classification: SYNTHETIC_CLASSIFICATION,
    applicationId,
    credentialVersionId,
    generatedAt,
  };
}
