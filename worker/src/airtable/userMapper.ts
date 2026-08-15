import type { AirtableRecord } from "./AirtableClient";
import {
  type AuthorizedUser,
  type UserFields,
  userFieldsSchema,
} from "./userSchema";

export function mapUser(record: AirtableRecord<UserFields>): AuthorizedUser {
  const fields = userFieldsSchema.parse(record.fields);
  return {
    id: fields.userId,
    loginIdentifier: fields.loginIdentifier.trim().toLowerCase(),
    displayName: fields.displayName,
    profile: fields.profile,
    enabled: fields.enabled,
    permissions: [...new Set(fields.permissions)],
    institutionIds: fields.institutionIds
      ? [...new Set(fields.institutionIds)]
      : undefined,
    updatedAt: fields.updatedAt,
    corporateIssuer: fields.corporateIssuer,
    corporateSubject: fields.corporateSubject,
    identityValidatedAt: fields.identityValidatedAt,
  };
}
