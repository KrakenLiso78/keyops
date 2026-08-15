import type { AuthorizedUser } from "../../src/airtable/userSchema";
import { ApiError } from "../../src/http/ApiError";
import type { AuthorizedUserStore } from "../../src/users/authorizedUserService";

export class InMemoryAuthorizedUserStore implements AuthorizedUserStore {
  readonly users: AuthorizedUser[];

  constructor(users: AuthorizedUser[]) {
    this.users = structuredClone(users);
  }

  async list() {
    return structuredClone(this.users);
  }

  async findById(userId: string) {
    return structuredClone(this.users.find((user) => user.id === userId));
  }

  async findByCorporateIdentity(issuer: string, subject: string) {
    return structuredClone(
      this.users.find(
        (user) =>
          user.corporateIssuer === issuer && user.corporateSubject === subject,
      ),
    );
  }

  async registerCorporate(fields: {
    userId: string;
    loginIdentifier: string;
    displayName: string;
    profile: AuthorizedUser["profile"];
    enabled: boolean;
    permissions: AuthorizedUser["permissions"];
    updatedAt?: string;
    corporateIssuer?: string;
    corporateSubject?: string;
    identityValidatedAt?: string;
  }) {
    const existing = await this.findByCorporateIdentity(
      fields.corporateIssuer!,
      fields.corporateSubject!,
    );
    if (existing) return existing;
    const created: AuthorizedUser = { id: fields.userId, ...fields };
    this.users.push(created);
    return structuredClone(created);
  }

  async updateAuthorization(
    userId: string,
    expectedUpdatedAt: string,
    patch: Pick<
      AuthorizedUser,
      "profile" | "enabled" | "permissions" | "updatedAt"
    >,
  ) {
    const target = this.users.find((user) => user.id === userId);
    if (!target) throw new ApiError(404, "user_not_found", "not found");
    if (target.updatedAt !== expectedUpdatedAt) {
      throw new ApiError(409, "stale_user", "stale");
    }
    Object.assign(target, patch);
    return structuredClone(target);
  }
}
