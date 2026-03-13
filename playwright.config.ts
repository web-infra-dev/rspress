import { defineConfig } from '@playwright/test';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  // exclude webpack / rspack self-feature test cases when run rspack / webpack test
  testDir: './e2e',
  // 30 min for all tests
  globalTimeout: 30 * 60 * 1000,
  // 1 min for each test
  timeout: 60 * 1000,
  quiet: true,
  reporter: 'list',
  use: {
    trace: isCI ? 'on-first-retry' : 'on',
    video: isCI ? 'off' : 'on',
    viewport: { width: 1440, height: 900 }, // screen size
    // Use the built-in Chrome browser to speed up CI tests
    channel: isCI ? 'chrome' : undefined,
  },
  retries: isCI ? 3 : 0,
});
