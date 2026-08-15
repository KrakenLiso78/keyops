import type {
  AuthorizedUser,
  Permission,
  UserFields,
} from "../airtable/userSchema";
import { authorize } from "../auth/authorize";
import { ApiError } from "../http/ApiError";

const analystPermissions: Permission[] = [
  "applications:read",
  "credentials:issue",
  "credentials:regenerate",
  "credentials:deliver",
  "credentials:suspend",
  "credentials:reactivate",
  "management:write",
  "usage:read",
];

export const permissionsByProfile: Readonly<
  Record<UserFields["profile"], readonly Permission[]>
> = {
  analyst: analystPermissions,
  senior_analyst: [...analystPermissions, "credentials:revoke", "audit:read"],
  administrator: [
    ...analystPermissions,
    "credentials:revoke",
    "audit:read",
    "users:write",
  ],
  auditor: ["audit:read"],
};

export function canonicalPermissions(
  profile: UserFields["profile"],
): Permission[] {
  return [...permissionsByProfile[profile]];
}

export function assertCanManageUsers(actor: AuthorizedUser): void {
  authorize(actor, "users:write");
}

export function assertUserUpdateAllowed(input: {
  actor: AuthorizedUser;
  target: AuthorizedUser;
  users: AuthorizedUser[];
  profile: UserFields["profile"];
  enabled: boolean;
}): void {
  assertCanManageUsers(input.actor);
  const targetIsEffectiveAdmin =
    input.target.enabled && input.target.permissions.includes("users:write");
  const remainsEffectiveAdmin =
    input.enabled &&
    canonicalPermissions(input.profile).includes("users:write");
  const effectiveAdmins = input.users.filter(
    (user) => user.enabled && user.permissions.includes("users:write"),
  );
  if (
    targetIsEffectiveAdmin &&
    !remainsEffectiveAdmin &&
    effectiveAdmins.length <= 1
  ) {
    throw new ApiError(
      409,
      "last_administrator",
      "Debe permanecer al menos un administrador habilitado.",
    );
  }
  if (input.actor.id === input.target.id) {
    throw new ApiError(
      403,
      "self_administration_forbidden",
      "No puedes modificar tu propio perfil o acceso.",
    );
  }
}
