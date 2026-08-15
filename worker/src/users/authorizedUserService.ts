import { z } from "zod";
import type { UserRepository } from "../airtable/UserRepository";
import { userFieldsSchema, type AuthorizedUser } from "../airtable/userSchema";
import { ApiError } from "../http/ApiError";
import {
  assertCanManageUsers,
  assertUserUpdateAllowed,
  canonicalPermissions,
} from "./userAdministrationPolicy";

export const registerAuthorizedUserSchema = z
  .object({
    corporateIssuer: z
      .string()
      .url()
      .refine((value) => value.startsWith("https://")),
    corporateSubject: z.string().trim().min(1).max(255),
    profile: z.enum(["analyst", "senior_analyst", "administrator", "auditor"]),
    enabled: z.boolean(),
  })
  .strict();

export const updateAuthorizedUserSchema = z
  .object({
    profile: z.enum(["analyst", "senior_analyst", "administrator", "auditor"]),
    enabled: z.boolean(),
  })
  .strict();

export interface AuthorizedUserStore {
  list(): Promise<AuthorizedUser[]>;
  findById(userId: string): Promise<AuthorizedUser | undefined>;
  findByCorporateIdentity(
    issuer: string,
    subject: string,
  ): Promise<AuthorizedUser | undefined>;
  registerCorporate(
    fields: z.infer<typeof userFieldsSchema>,
  ): Promise<AuthorizedUser>;
  updateAuthorization(
    userId: string,
    expectedUpdatedAt: string,
    patch: Pick<
      z.infer<typeof userFieldsSchema>,
      "profile" | "enabled" | "permissions" | "updatedAt"
    >,
  ): Promise<AuthorizedUser>;
}

async function stableUserId(issuer: string, subject: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${issuer}\u0000${subject}`),
  );
  return `usr-${Array.from(new Uint8Array(digest))
    .slice(0, 12)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;
}

export async function listAuthorizedUsers(
  actor: AuthorizedUser,
  users: AuthorizedUserStore,
) {
  assertCanManageUsers(actor);
  return users.list();
}

export async function registerAuthorizedUser(
  actor: AuthorizedUser,
  users: AuthorizedUserStore,
  raw: unknown,
  now = new Date().toISOString(),
) {
  assertCanManageUsers(actor);
  const parsed = registerAuthorizedUserSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ApiError(
      400,
      "invalid_user",
      "La autorización del usuario no es válida.",
    );
  }
  const existing = await users.findByCorporateIdentity(
    parsed.data.corporateIssuer,
    parsed.data.corporateSubject,
  );
  if (existing) return existing;
  const userId = await stableUserId(
    parsed.data.corporateIssuer,
    parsed.data.corporateSubject,
  );
  return users.registerCorporate(
    userFieldsSchema.parse({
      userId,
      loginIdentifier: userId,
      displayName: "Identidad pendiente de validación",
      profile: parsed.data.profile,
      enabled: parsed.data.enabled,
      permissions: canonicalPermissions(parsed.data.profile),
      corporateIssuer: parsed.data.corporateIssuer,
      corporateSubject: parsed.data.corporateSubject,
      updatedAt: now,
    }),
  );
}

export async function updateAuthorizedUser(
  actor: AuthorizedUser,
  users: AuthorizedUserStore,
  input: {
    userId: string;
    expectedUpdatedAt: string;
    command: unknown;
    now?: string;
  },
) {
  const parsed = updateAuthorizedUserSchema.safeParse(input.command);
  if (!parsed.success) {
    throw new ApiError(
      400,
      "invalid_user",
      "La autorización del usuario no es válida.",
    );
  }
  const [target, currentUsers] = await Promise.all([
    users.findById(input.userId),
    users.list(),
  ]);
  if (!target) {
    throw new ApiError(
      404,
      "user_not_found",
      "No se encontró el usuario autorizado.",
    );
  }
  assertUserUpdateAllowed({
    actor,
    target,
    users: currentUsers,
    ...parsed.data,
  });
  return users.updateAuthorization(input.userId, input.expectedUpdatedAt, {
    ...parsed.data,
    permissions: canonicalPermissions(parsed.data.profile),
    updatedAt: input.now ?? new Date().toISOString(),
  });
}

export type PersistentAuthorizedUserStore = UserRepository;
