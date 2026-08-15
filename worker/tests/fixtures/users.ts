import type { UserFields } from "../../src/airtable/userSchema";

export const userFixtures: UserFields[] = [
  {
    userId: "user-analyst",
    loginIdentifier: "analyst@example.invalid",
    displayName: "Analista Demo",
    profile: "analyst",
    enabled: true,
    permissions: ["applications:read", "credentials:issue", "management:write"],
    updatedAt: "2026-08-15T09:00:00.000Z",
  },
  {
    userId: "user-disabled",
    loginIdentifier: "disabled@example.invalid",
    displayName: "Usuario deshabilitado",
    profile: "analyst",
    enabled: false,
    permissions: ["applications:read"],
    updatedAt: "2026-08-15T09:00:00.000Z",
  },
];
