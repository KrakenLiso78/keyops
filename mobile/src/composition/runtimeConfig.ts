import { z } from 'zod';

const schema = z.object({
  EXPO_PUBLIC_API_BASE_URL: z.string().url().default('https://api.example.invalid'),
  EXPO_PUBLIC_DATA_SOURCE: z.literal('fake').default('fake'),
});

export const runtimeConfig = schema.parse({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_DATA_SOURCE: process.env.EXPO_PUBLIC_DATA_SOURCE,
});
