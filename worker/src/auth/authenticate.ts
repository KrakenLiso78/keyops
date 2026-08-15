import type { UserRepository } from "../airtable/UserRepository";
import type { AuthorizedUser } from "../airtable/userSchema";
import { ApiError } from "../http/ApiError";
import { verifySessionToken } from "./sessionToken";
import { verifyCorporateSession } from "./corporateSession";
import { readCookie } from "./cookies";

export async function authenticate(
  request: Request,
  users: UserRepository,
  signingKey: string,
): Promise<AuthorizedUser> {
  const corporateCookie = readCookie(request, "keyops_session");
  if (corporateCookie) {
    const claims = await verifyCorporateSession(corporateCookie, signingKey);
    const user = await users.findById(claims.userId);
    if (!user?.enabled) throw invalidSession();
    return user;
  }
  const header = request.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/iu);
  if (!match?.[1]) throw invalidSession();
  const claims = await verifySessionToken(match[1], signingKey);
  const user = await users.findById(claims.sub);
  if (!user?.enabled) throw invalidSession();
  return user;
}

const invalidSession = () =>
  new ApiError(401, "invalid_session", "La sesión no es válida o ha caducado.");
