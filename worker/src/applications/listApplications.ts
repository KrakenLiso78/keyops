import type { AuthorizedUser } from "../airtable/userSchema";
import type {
  ApplicationListQuery,
  ApplicationRepository,
} from "../airtable/ApplicationRepository";
import { authorize } from "../auth/authorize";

export async function listApplications(
  user: AuthorizedUser,
  repository: ApplicationRepository,
  query: ApplicationListQuery,
) {
  authorize(user, "applications:read");
  return repository.list(query);
}
