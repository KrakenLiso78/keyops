import { z } from 'zod';

const schema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z.union([z.literal(''), z.string().url()]).default(''),
  EXPO_PUBLIC_DATA_SOURCE: z.enum(['remote', 'fake']).default('remote'),
});

export const runtimeConfig = schema.parse({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_DATA_SOURCE: process.env.EXPO_PUBLIC_DATA_SOURCE,
});
