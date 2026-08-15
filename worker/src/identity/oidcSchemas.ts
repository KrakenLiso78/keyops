import { z } from "zod";

export const oidcDiscoverySchema = z.object({
  issuer: z.string().url(),
  authorization_endpoint: z.string().url(),
  token_endpoint: z.string().url(),
  jwks_uri: z.string().url(),
  userinfo_endpoint: z.string().url().optional(),
  code_challenge_methods_supported: z.array(z.string()).optional(),
  id_token_signing_alg_values_supported: z.array(z.string()).optional(),
});

export const oidcTokenResponseSchema = z.object({
  id_token: z.string().min(20),
  access_token: z.string().min(1).optional(),
  token_type: z.string().optional(),
  expires_in: z.number().positive().optional(),
});

export const oidcJwkSchema = z.object({
  kty: z.literal("RSA"),
  kid: z.string().min(1),
  use: z.literal("sig").optional(),
  alg: z.literal("RS256").optional(),
  n: z.string().min(1),
  e: z.string().min(1),
});

export const oidcJwksSchema = z.object({ keys: z.array(oidcJwkSchema) });

export const oidcClaimsSchema = z.object({
  iss: z.string().url(),
  sub: z.string().min(1).max(255),
  aud: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  exp: z.number().int().positive(),
  iat: z.number().int().positive(),
  nonce: z.string().min(16),
  name: z.string().min(1).max(200).optional(),
  active: z.boolean().optional(),
});
