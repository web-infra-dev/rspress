import { defineConfig } from '@playwright/test';

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
    trace: 'on',
    video: 'on',
    viewport: { width: 1440, height: 900 }, // screen size
  },
  retries: process.env.CI ? 3 : 0,
});
