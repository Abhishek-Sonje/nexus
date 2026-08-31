import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command:
      'node apps/web/node_modules/next/dist/bin/next dev apps/web -p 3100 -H 127.0.0.1',
    url: 'http://localhost:3100/api/health/live',
    env: {
      ...process.env,
      NEXUS_ACCESS_PASSWORD_HASH: process.env.NEXUS_ACCESS_PASSWORD_HASH ?? '',
      NEXUS_TEST_PASSWORD: process.env.NEXUS_TEST_PASSWORD ?? '',
    },
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
