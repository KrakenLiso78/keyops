import { issueSessionToken } from "../../src/auth/sessionToken";
import type { WorkerEnv } from "../../src/config/env";

export const applicationEnv: WorkerEnv = {
  AIRTABLE_BASE_ID: "app00000000000000",
  AIRTABLE_PAT: "test-token-value",
  DEMO_CREDENTIALS_JSON: "{}",
  SESSION_SIGNING_KEY: "test-signing-key-with-at-least-32-characters",
  DELIVERY_PEPPER: "test-delivery-pepper-with-at-least-32-characters",
  CATALOG_BASE_URL: "https://catalog.test",
  CATALOG_READ_TOKEN: "test-read-only-catalog-token",
};

export async function authorizationHeader() {
  const { token } = await issueSessionToken(
    "user-analyst",
    applicationEnv.SESSION_SIGNING_KEY,
  );
  return { authorization: `Bearer ${token}` };
}
