import { ApiError } from "../http/ApiError";
import { openCookie, sealCookie } from "./authorizationTransaction";

interface CorporateSessionClaims {
  userId: string;
  identityHash: string;
  issuedAt: number;
  validatedAt: number;
  expiresAt: number;
  version: 1;
}

const maxAgeMs = 5 * 60_000;

async function identityHash(issuer: string, subject: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${issuer}\u0000${subject}`),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function issueCorporateSession(input: {
  userId: string;
  issuer: string;
  subject: string;
  secret: string;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const claims: CorporateSessionClaims = {
    userId: input.userId,
    identityHash: await identityHash(input.issuer, input.subject),
    issuedAt: now,
    validatedAt: now,
    expiresAt: now + maxAgeMs,
    version: 1,
  };
  const value = await sealCookie(claims, input.secret);
  return {
    cookie: `keyops_session=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`,
    expiresAt: new Date(claims.expiresAt).toISOString(),
  };
}

export async function verifyCorporateSession(
  value: string,
  secret: string,
  now = Date.now(),
) {
  let claims: CorporateSessionClaims;
  try {
    claims = await openCookie<CorporateSessionClaims>(value, secret);
  } catch {
    throw invalidSession();
  }
  if (
    claims.version !== 1 ||
    !claims.userId ||
    claims.expiresAt <= now ||
    now - claims.validatedAt > maxAgeMs
  ) {
    throw invalidSession();
  }
  return claims;
}

export const clearCorporateSessionCookie =
  "keyops_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";

const invalidSession = () =>
  new ApiError(401, "invalid_session", "La sesión no es válida o ha caducado.");
