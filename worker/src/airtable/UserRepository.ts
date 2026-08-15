import { ApiError } from "../http/ApiError";
import type { AirtableClient } from "./AirtableClient";
import { mapUser } from "./userMapper";
import type { AuthorizedUser, UserFields } from "./userSchema";

const escapeFormula = (value: string) =>
  value.replaceAll("\\", "\\\\").replaceAll("'", "\\'");

export class UserRepository {
  constructor(private readonly client: AirtableClient) {}

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

  async list(): Promise<AuthorizedUser[]> {
    return (await this.client.list<UserFields>("Users")).map(mapUser);
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
