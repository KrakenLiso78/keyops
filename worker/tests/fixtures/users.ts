import type { AuthorizedUser, UserFields } from "../../src/airtable/userSchema";

export const userFixtures: UserFields[] = [
  {
    userId: "user-analyst",
    loginIdentifier: "analyst@example.invalid",
    displayName: "Analista Demo",
    profile: "analyst",
    enabled: true,
    permissions: ["applications:read", "credentials:issue", "management:write"],
    updatedAt: "2026-08-15T09:00:00.000Z",
    corporateIssuer: "https://identity.example.test",
    corporateSubject: "corporate-subject-001",
  },
  {
    userId: "user-disabled",
    loginIdentifier: "disabled@example.invalid",
    displayName: "Usuario deshabilitado",
    profile: "analyst",
    enabled: false,
    permissions: ["applications:read"],
    updatedAt: "2026-08-15T09:00:00.000Z",
    corporateIssuer: "https://identity.example.test",
    corporateSubject: "corporate-subject-disabled",
  },
];

export const authorizedUserFixture: AuthorizedUser = {
  id: userFixtures[0]!.userId,
  loginIdentifier: userFixtures[0]!.loginIdentifier,
  displayName: userFixtures[0]!.displayName,
  profile: userFixtures[0]!.profile,
  enabled: userFixtures[0]!.enabled,
  permissions: userFixtures[0]!.permissions,
  institutionIds: userFixtures[0]!.institutionIds,
};
