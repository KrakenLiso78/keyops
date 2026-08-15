import type { AuthorizedUser, Permission } from "../airtable/userSchema";
import { ApiError } from "../http/ApiError";
import type { UserRepository } from "../airtable/UserRepository";

export function authorize(user: AuthorizedUser, permission: Permission): void {
  if (!user.enabled || !user.permissions.includes(permission)) {
    throw new ApiError(
      403,
      "forbidden",
      "No tienes permiso para realizar esta acción.",
    );
  }
}

export async function authorizeCorporateIdentity(
  users: UserRepository,
  issuer: string,
  subject: string,
): Promise<AuthorizedUser> {
  const user = await users.findByCorporateIdentity(issuer, subject);
  if (!user?.enabled) {
    throw new ApiError(
      401,
      "corporate_access_denied",
      "La identidad corporativa no está autorizada para acceder a KeyOps.",
    );
  }
  return user;
}
