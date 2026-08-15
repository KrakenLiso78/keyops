import { ApiError } from "../http/ApiError";

interface SessionClaims {
  sub: string;
  iat: number;
  exp: number;
  jti: string;
  v: 1;
}

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
};

const fromBase64Url = (value: string): Uint8Array => {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

async function hmac(value: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(value)),
  );
}

export async function issueSessionToken(
  userId: string,
  secret: string,
  now = Date.now(),
  ttlSeconds = 15 * 60,
): Promise<{ token: string; expiresAt: string }> {
  const issuedAt = Math.floor(now / 1000);
  const claims: SessionClaims = {
    sub: userId,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
    jti: crypto.randomUUID(),
    v: 1,
  };
  const payload = toBase64Url(encoder.encode(JSON.stringify(claims)));
  const signature = toBase64Url(await hmac(payload, secret));
  return {
    token: `${payload}.${signature}`,
    expiresAt: new Date(claims.exp * 1000).toISOString(),
  };
}

export async function verifySessionToken(
  token: string,
  secret: string,
  now = Date.now(),
): Promise<SessionClaims> {
  const [payload, suppliedSignature, extra] = token.split(".");
  if (!payload || !suppliedSignature || extra) throw unauthorized();
  const expected = await hmac(payload, secret);
  const supplied = fromBase64Url(suppliedSignature);
  if (expected.length !== supplied.length) throw unauthorized();
  let difference = 0;
  expected.forEach((byte, index) => (difference |= byte ^ supplied[index]!));
  if (difference !== 0) throw unauthorized();
  try {
    const claims = JSON.parse(
      new TextDecoder().decode(fromBase64Url(payload)),
    ) as SessionClaims;
    if (claims.v !== 1 || !claims.sub || claims.exp <= Math.floor(now / 1000))
      throw unauthorized();
    return claims;
  } catch {
    throw unauthorized();
  }
}

const unauthorized = () =>
  new ApiError(401, "invalid_session", "La sesión no es válida o ha caducado.");
