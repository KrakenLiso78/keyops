import { ApiError } from "../http/ApiError";
import type { OidcJwks } from "./OidcProviderPort";
import { oidcClaimsSchema } from "./oidcSchemas";

const decoder = new TextDecoder();

function decodeBase64Url(value: string): Uint8Array {
  try {
    const padded = value
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "=");
    return Uint8Array.from(atob(padded), (character) =>
      character.charCodeAt(0),
    );
  } catch {
    throw invalidIdentity();
  }
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(decoder.decode(decodeBase64Url(value)));
  } catch {
    throw invalidIdentity();
  }
}

export async function validateIdToken(input: {
  idToken: string;
  jwks: OidcJwks;
  expectedIssuer: string;
  expectedAudience: string;
  expectedNonce: string;
  configuredRedirectUri: string;
  callbackRedirectUri: string;
  now?: number;
}) {
  if (input.callbackRedirectUri !== input.configuredRedirectUri) {
    throw invalidIdentity("invalid_redirect_uri");
  }
  const [encodedHeader, encodedPayload, encodedSignature, extra] =
    input.idToken.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature || extra) {
    throw invalidIdentity();
  }
  const header = parseJson(encodedHeader) as Record<string, unknown>;
  if (header.alg !== "RS256" || typeof header.kid !== "string") {
    throw invalidIdentity("invalid_token_algorithm");
  }
  const parsed = oidcClaimsSchema.safeParse(parseJson(encodedPayload));
  if (!parsed.success) throw invalidIdentity();
  const claims = parsed.data;
  const nowSeconds = Math.floor((input.now ?? Date.now()) / 1_000);
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (
    claims.iss.replace(/\/$/u, "") !==
      input.expectedIssuer.replace(/\/$/u, "") ||
    !audience.includes(input.expectedAudience) ||
    claims.nonce !== input.expectedNonce ||
    claims.exp <= nowSeconds ||
    claims.iat > nowSeconds + 60 ||
    claims.active === false
  ) {
    throw invalidIdentity();
  }
  const jwk = input.jwks.keys.find((candidate) => candidate.kid === header.kid);
  if (
    !jwk ||
    (jwk.alg && jwk.alg !== "RS256") ||
    (jwk.use && jwk.use !== "sig")
  ) {
    throw invalidIdentity("unknown_signing_key");
  }
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signature = decodeBase64Url(encodedSignature);
    const signatureBuffer = signature.buffer.slice(
      signature.byteOffset,
      signature.byteOffset + signature.byteLength,
    ) as ArrayBuffer;
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      signatureBuffer,
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    );
    if (!valid) throw invalidIdentity("invalid_token_signature");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw invalidIdentity("invalid_token_signature");
  }
  return claims;
}

const invalidIdentity = (code = "invalid_identity_token") =>
  new ApiError(401, code, "No se pudo validar la identidad corporativa.");
