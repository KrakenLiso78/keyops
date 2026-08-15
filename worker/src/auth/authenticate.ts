import type { UserRepository } from "../airtable/UserRepository";
import type { AuthorizedUser } from "../airtable/userSchema";
import { ApiError } from "../http/ApiError";
import { verifySessionToken } from "./sessionToken";

export async function authenticate(
  request: Request,
  users: UserRepository,
  signingKey: string,
): Promise<AuthorizedUser> {
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/iu);
  if (!match?.[1])
    throw new ApiError(
      401,
      "invalid_session",
      "La sesión no es válida o ha caducado.",
    );
  const claims = await verifySessionToken(match[1], signingKey);
  const user = await users.findById(claims.sub);
  if (!user?.enabled)
    throw new ApiError(
      401,
      "invalid_session",
      "La sesión no es válida o ha caducado.",
    );
  return user;
}
