import { ApiError } from "../http/ApiError";
import type { AirtableClient } from "./AirtableClient";
import { mapUser } from "./userMapper";
import type { AuthorizedUser, UserFields } from "./userSchema";

type UserClient = Pick<AirtableClient, "list" | "create" | "update" | "upsert">;

const escapeFormula = (value: string) =>
  value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");

export class UserRepository {
  constructor(private readonly client: UserClient) {}

  async findById(userId: string): Promise<AuthorizedUser | undefined> {
    return this.findOne(`{userId}='${escapeFormula(userId)}'`);
  }

  async findByLoginIdentifier(
    loginIdentifier: string,
  ): Promise<AuthorizedUser | undefined> {
    const normalized = loginIdentifier.trim().toLowerCase();
    return this.findOne(
      `LOWER({loginIdentifier})='${escapeFormula(normalized)}'`,
    );
  }

  async findByCorporateIdentity(
    issuer: string,
    subject: string,
  ): Promise<AuthorizedUser | undefined> {
    return this.findOne(
      `AND({corporateIssuer}='${escapeFormula(issuer)}',{corporateSubject}='${escapeFormula(subject)}')`,
    );
  }

  async markIdentityValidated(
    userId: string,
    input: { displayName?: string; identityValidatedAt: string },
  ): Promise<AuthorizedUser> {
    const records = await this.client.list<UserFields>("Users", {
      filterByFormula: `{userId}='${escapeFormula(userId)}'`,
      maxRecords: "2",
    });
    if (records.length !== 1) {
      throw new ApiError(
        records.length === 0 ? 404 : 409,
        records.length === 0 ? "user_not_found" : "duplicate_user",
        records.length === 0
          ? "No se encontró el usuario autorizado."
          : "La autorización del usuario es ambigua.",
      );
    }
    const current = mapUser(records[0]!);
    const updated = await this.client.update<UserFields>(
      "Users",
      records[0]!.id,
      {
        displayName: input.displayName ?? current.displayName,
        identityValidatedAt: input.identityValidatedAt,
      },
    );
    return mapUser(updated);
  }

  async list(): Promise<AuthorizedUser[]> {
    return (await this.client.list<UserFields>("Users")).map(mapUser);
  }

  async registerCorporate(fields: UserFields): Promise<AuthorizedUser> {
    const existing = await this.findByCorporateIdentity(
      fields.corporateIssuer!,
      fields.corporateSubject!,
    );
    if (existing) return existing;
    return mapUser(
      await this.client.upsert<UserFields>("Users", fields, [
        "corporateIssuer",
        "corporateSubject",
      ]),
    );
  }

  async updateAuthorization(
    userId: string,
    expectedUpdatedAt: string,
    patch: Pick<
      UserFields,
      "profile" | "enabled" | "permissions" | "updatedAt"
    >,
  ): Promise<AuthorizedUser> {
    const records = await this.client.list<UserFields>("Users", {
      filterByFormula: `{userId}='${escapeFormula(userId)}'`,
      maxRecords: "2",
    });
    if (records.length === 0) {
      throw new ApiError(
        404,
        "user_not_found",
        "No se encontró el usuario autorizado.",
      );
    }
    if (records.length > 1) {
      throw new ApiError(
        409,
        "duplicate_user",
        "La autorización del usuario es ambigua.",
      );
    }
    const current = mapUser(records[0]!);
    if (current.updatedAt !== expectedUpdatedAt) {
      throw new ApiError(
        409,
        "stale_user",
        "La autorización ha cambiado; vuelve a cargarla.",
      );
    }
    return mapUser(
      await this.client.update<UserFields>("Users", records[0]!.id, patch),
    );
  }

  private async findOne(formula: string): Promise<AuthorizedUser | undefined> {
    const records = await this.client.list<UserFields>("Users", {
      filterByFormula: formula,
      maxRecords: "2",
    });
    if (records.length > 1) {
      throw new ApiError(
        409,
        "duplicate_user",
        "La autorización del usuario es ambigua.",
      );
    }
    return records[0] ? mapUser(records[0]) : undefined;
  }
}
