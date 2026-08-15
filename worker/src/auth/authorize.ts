import type { AuthorizedUser, Permission } from "../airtable/userSchema";
import { ApiError } from "../http/ApiError";

export function authorize(user: AuthorizedUser, permission: Permission): void {
  if (!user.enabled || !user.permissions.includes(permission)) {
    throw new ApiError(
      403,
      "forbidden",
      "No tienes permiso para realizar esta acción.",
    );
  }
}
