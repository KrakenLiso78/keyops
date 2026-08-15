import { defineConfig } from '@playwright/test';

const port = 8087;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'line',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx expo start --web --port ${port}`,
    env: {
      CI: '1',
      EXPO_PUBLIC_DATA_SOURCE: 'fake',
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: `http://127.0.0.1:${port}/sign-in`,
  },
  projects: [
    { name: 'iphone-390', use: { viewport: { width: 390, height: 844 } } },
    { name: 'mobile-360', use: { viewport: { width: 360, height: 800 } } },
  ],
});
