import { z } from "zod";

export interface WorkerEnv {
  AIRTABLE_BASE_ID: string;
  AIRTABLE_PAT: string;
  DEMO_CREDENTIALS_JSON: string;
  SESSION_SIGNING_KEY: string;
  DELIVERY_PEPPER: string;
  CATALOG_BASE_URL?: string;
  CATALOG_READ_TOKEN?: string;
  OIDC_ISSUER?: string;
  OIDC_CLIENT_ID?: string;
  OIDC_CLIENT_SECRET?: string;
  OIDC_REDIRECT_URI?: string;
  REAL_CREDENTIAL_PROVIDER_BASE_URL?: string;
  REAL_CREDENTIAL_PROVIDER_TOKEN?: string;
  SECURE_DELIVERY_BASE_URL?: string;
  SECURE_DELIVERY_TOKEN?: string;
  REAL_CREDENTIAL_ENVIRONMENTS?: string;
  COMPLIANCE_AUDIT_MODE?: string;
  COMPLIANCE_AUDIT_BASE_URL?: string;
  COMPLIANCE_AUDIT_APPEND_TOKEN?: string;
  COMPLIANCE_AUDIT_QUERY_TOKEN?: string;
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
    OIDC_ISSUER: z.string().url().optional(),
    OIDC_CLIENT_ID: z.string().min(3).optional(),
    OIDC_CLIENT_SECRET: z.string().min(12).optional(),
    OIDC_REDIRECT_URI: z.string().url().optional(),
    REAL_CREDENTIAL_PROVIDER_BASE_URL: z.string().url().optional(),
    REAL_CREDENTIAL_PROVIDER_TOKEN: z.string().min(12).optional(),
    SECURE_DELIVERY_BASE_URL: z.string().url().optional(),
    SECURE_DELIVERY_TOKEN: z.string().min(12).optional(),
    REAL_CREDENTIAL_ENVIRONMENTS: z.string().min(1).optional(),
    COMPLIANCE_AUDIT_MODE: z.literal("v2").optional(),
    COMPLIANCE_AUDIT_BASE_URL: z.string().url().optional(),
    COMPLIANCE_AUDIT_APPEND_TOKEN: z.string().min(12).optional(),
    COMPLIANCE_AUDIT_QUERY_TOKEN: z.string().min(12).optional(),
  })
  .superRefine((value, context) => {
    if (Boolean(value.CATALOG_BASE_URL) !== Boolean(value.CATALOG_READ_TOKEN)) {
      context.addIssue({
        code: "custom",
        path: ["CATALOG_BASE_URL"],
        message: "Catalog URL and read token must be configured together.",
      });
    }
    const oidc = [
      value.OIDC_ISSUER,
      value.OIDC_CLIENT_ID,
      value.OIDC_CLIENT_SECRET,
      value.OIDC_REDIRECT_URI,
    ];
    if (oidc.some(Boolean) && !oidc.every(Boolean)) {
      context.addIssue({
        code: "custom",
        path: ["OIDC_ISSUER"],
        message: "All OIDC bindings must be configured together.",
      });
    }
    const realCredentials = [
      value.REAL_CREDENTIAL_PROVIDER_BASE_URL,
      value.REAL_CREDENTIAL_PROVIDER_TOKEN,
      value.SECURE_DELIVERY_BASE_URL,
      value.SECURE_DELIVERY_TOKEN,
      value.REAL_CREDENTIAL_ENVIRONMENTS,
    ];
    if (realCredentials.some(Boolean) && !realCredentials.every(Boolean)) {
      context.addIssue({
        code: "custom",
        path: ["REAL_CREDENTIAL_PROVIDER_BASE_URL"],
        message: "All real credential bindings must be configured together.",
      });
    }
    const compliance = [
      value.COMPLIANCE_AUDIT_MODE,
      value.COMPLIANCE_AUDIT_BASE_URL,
      value.COMPLIANCE_AUDIT_APPEND_TOKEN,
      value.COMPLIANCE_AUDIT_QUERY_TOKEN,
    ];
    if (compliance.some(Boolean) && !compliance.every(Boolean)) {
      context.addIssue({
        code: "custom",
        path: ["COMPLIANCE_AUDIT_MODE"],
        message: "All compliance audit bindings must be configured together.",
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
  oidc?: {
    issuer: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  realCredentials?: {
    provider: { baseUrl: string; token: string };
    delivery: { baseUrl: string; token: string };
    allowedEnvironments: ReadonlySet<"test" | "production">;
  };
  complianceAudit?: {
    mode: "v2";
    baseUrl: string;
    appendToken: string;
    queryToken: string;
  };
}

export function validateEnv(env: WorkerEnv): ValidatedEnv {
  const parsed = workerEnvSchema.parse(env);
  const credentials = z
    .record(z.string().min(1), z.string().min(1))
    .parse(JSON.parse(parsed.DEMO_CREDENTIALS_JSON));
  const realEnvironments = parsed.REAL_CREDENTIAL_ENVIRONMENTS
    ? z
        .array(z.enum(["test", "production"]))
        .min(1)
        .parse(
          parsed.REAL_CREDENTIAL_ENVIRONMENTS.split(",").map((value) =>
            value.trim(),
          ),
        )
    : undefined;
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
    oidc:
      parsed.OIDC_ISSUER &&
      parsed.OIDC_CLIENT_ID &&
      parsed.OIDC_CLIENT_SECRET &&
      parsed.OIDC_REDIRECT_URI
        ? {
            issuer: parsed.OIDC_ISSUER,
            clientId: parsed.OIDC_CLIENT_ID,
            clientSecret: parsed.OIDC_CLIENT_SECRET,
            redirectUri: parsed.OIDC_REDIRECT_URI,
          }
        : undefined,
    realCredentials:
      parsed.REAL_CREDENTIAL_PROVIDER_BASE_URL &&
      parsed.REAL_CREDENTIAL_PROVIDER_TOKEN &&
      parsed.SECURE_DELIVERY_BASE_URL &&
      parsed.SECURE_DELIVERY_TOKEN &&
      realEnvironments
        ? {
            provider: {
              baseUrl: parsed.REAL_CREDENTIAL_PROVIDER_BASE_URL.replace(
                /\/$/u,
                "",
              ),
              token: parsed.REAL_CREDENTIAL_PROVIDER_TOKEN,
            },
            delivery: {
              baseUrl: parsed.SECURE_DELIVERY_BASE_URL.replace(/\/$/u, ""),
              token: parsed.SECURE_DELIVERY_TOKEN,
            },
            allowedEnvironments: new Set(realEnvironments),
          }
        : undefined,
    complianceAudit:
      parsed.COMPLIANCE_AUDIT_MODE &&
      parsed.COMPLIANCE_AUDIT_BASE_URL &&
      parsed.COMPLIANCE_AUDIT_APPEND_TOKEN &&
      parsed.COMPLIANCE_AUDIT_QUERY_TOKEN
        ? {
            mode: parsed.COMPLIANCE_AUDIT_MODE,
            baseUrl: parsed.COMPLIANCE_AUDIT_BASE_URL.replace(/\/$/u, ""),
            appendToken: parsed.COMPLIANCE_AUDIT_APPEND_TOKEN,
            queryToken: parsed.COMPLIANCE_AUDIT_QUERY_TOKEN,
          }
        : undefined,
  };
}
