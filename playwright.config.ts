import { defineConfig } from '@playwright/test';

export default defineConfig({
  // exclude webpack / rspack self-feature test cases when run rspack / webpack test
  testDir: './e2e',
  // 1 hour for all tests
  globalTimeout: 60 * 60 * 1000,
  // 3 min for each test
  timeout: 60 * 5 * 1000,
  quiet: true,
  reporter: 'list',
  use: {
    trace: 'on',
    video: 'on',
  },
  retries: process.env.CI ? 3 : 0,
});
