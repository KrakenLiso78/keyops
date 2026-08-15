import { ApiError } from "../http/ApiError";

interface AuthorizationTransaction {
  state: string;
  nonce: string;
  verifier: string;
  returnPath: string;
  expiresAt: number;
}

export interface AuthorizationReplayStore {
  consume(state: string, expiresAt: number, now: number): boolean;
}

export class InMemoryAuthorizationReplayStore implements AuthorizationReplayStore {
  private readonly used = new Map<string, number>();

  consume(state: string, expiresAt: number, now: number): boolean {
    for (const [key, expiry] of this.used)
      if (expiry <= now) this.used.delete(key);
    if (this.used.has(state)) return false;
    this.used.set(state, expiresAt);
    return true;
  }
}

const encoder = new TextEncoder();

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

function fromBase64Url(value: string) {
  const padded = value
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function randomValue(bytes: number) {
  return base64Url(crypto.getRandomValues(new Uint8Array(bytes)));
}

async function encryptionKey(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function sealCookie(value: unknown, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await encryptionKey(secret),
    encoder.encode(JSON.stringify(value)),
  );
  return `${base64Url(iv)}.${base64Url(new Uint8Array(encrypted))}`;
}

export async function openCookie<T>(value: string, secret: string): Promise<T> {
  const [iv, ciphertext, extra] = value.split(".");
  if (!iv || !ciphertext || extra) throw invalidTransaction();
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64Url(iv) },
      await encryptionKey(secret),
      fromBase64Url(ciphertext),
    );
    return JSON.parse(new TextDecoder().decode(decrypted)) as T;
  } catch {
    throw invalidTransaction();
  }
}

export function normalizeReturnPath(value?: string | null) {
  if (!value) return "/applications";
  if (!/^\/(?:applications|audit|users)(?:\/[^?#]*)?$/u.test(value)) {
    throw new ApiError(
      400,
      "invalid_return_path",
      "La ruta de retorno no es válida.",
    );
  }
  return value;
}

export async function createAuthorizationTransaction(
  secret: string,
  returnPath?: string | null,
  now = Date.now(),
) {
  const transaction: AuthorizationTransaction = {
    state: randomValue(32),
    nonce: randomValue(32),
    verifier: randomValue(64),
    returnPath: normalizeReturnPath(returnPath),
    expiresAt: now + 10 * 60_000,
  };
  const challenge = base64Url(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(transaction.verifier),
      ),
    ),
  );
  const value = await sealCookie(transaction, secret);
  return {
    ...transaction,
    challenge,
    cookie: `keyops_oidc_tx=${value}; Path=/v1/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  };
}

export async function consumeAuthorizationTransaction(input: {
  cookieValue: string;
  suppliedState: string;
  secret: string;
  replayStore: AuthorizationReplayStore;
  now?: number;
}) {
  const transaction = await openCookie<AuthorizationTransaction>(
    input.cookieValue,
    input.secret,
  );
  const now = input.now ?? Date.now();
  if (
    transaction.expiresAt <= now ||
    transaction.state !== input.suppliedState ||
    !input.replayStore.consume(transaction.state, transaction.expiresAt, now)
  ) {
    throw invalidTransaction();
  }
  return transaction;
}

export const clearAuthorizationCookie =
  "keyops_oidc_tx=; Path=/v1/auth; HttpOnly; Secure; SameSite=Lax; Max-Age=0";

const invalidTransaction = () =>
  new ApiError(
    401,
    "invalid_oidc_transaction",
    "La transacción de acceso no es válida.",
  );
