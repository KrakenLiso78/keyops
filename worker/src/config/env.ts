import { z } from "zod";

export interface WorkerEnv {
  AIRTABLE_BASE_ID: string;
  AIRTABLE_PAT: string;
  DEMO_CREDENTIALS_JSON: string;
  SESSION_SIGNING_KEY: string;
  DELIVERY_PEPPER: string;
  CATALOG_BASE_URL?: string;
  CATALOG_READ_TOKEN?: string;
  ASSETS?: Fetcher;
}

const workerEnvSchema = z
  .object({
    AIRTABLE_BASE_ID: z.string().regex(/^app[A-Za-z0-9]{14}$/),
    AIRTABLE_PAT: z.string().min(10),
    DEMO_CREDENTIALS_JSON: z.string().min(2),
    SESSION_SIGNING_KEY: z.string().min(32),
    DELIVERY_PEPPER: z.string().min(32),
    CATALOG_BASE_URL: z.string().url().optional(),
    CATALOG_READ_TOKEN: z.string().min(12).optional(),
  })
  .superRefine((value, context) => {
    if (Boolean(value.CATALOG_BASE_URL) !== Boolean(value.CATALOG_READ_TOKEN)) {
      context.addIssue({
        code: "custom",
        path: ["CATALOG_BASE_URL"],
        message: "Catalog URL and read token must be configured together.",
      });
    }
  });

export interface ValidatedEnv {
  airtableBaseId: string;
  airtablePat: string;
  demoCredentials: Readonly<Record<string, string>>;
  sessionSigningKey: string;
  deliveryPepper: string;
  catalog?: { baseUrl: string; readToken: string };
}

export function validateEnv(env: WorkerEnv): ValidatedEnv {
  const parsed = workerEnvSchema.parse(env);
  const credentials = z
    .record(z.string().min(1), z.string().min(1))
    .parse(JSON.parse(parsed.DEMO_CREDENTIALS_JSON));
  return {
    airtableBaseId: parsed.AIRTABLE_BASE_ID,
    airtablePat: parsed.AIRTABLE_PAT,
    demoCredentials: credentials,
    sessionSigningKey: parsed.SESSION_SIGNING_KEY,
    deliveryPepper: parsed.DELIVERY_PEPPER,
    catalog:
      parsed.CATALOG_BASE_URL && parsed.CATALOG_READ_TOKEN
        ? {
            baseUrl: parsed.CATALOG_BASE_URL.replace(/\/$/u, ""),
            readToken: parsed.CATALOG_READ_TOKEN,
          }
        : undefined,
  };
}
