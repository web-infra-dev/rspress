import { defineConfig } from '@playwright/test';

export default defineConfig({
  // exclude webpack / rspack self-feature test cases when run rspack / webpack test
  testDir: './e2e',
  fullyParallel: false,
  // 1 hour for all tests
  globalTimeout: 60 * 60 * 1000,
  // 3 min for each test
  timeout: 60 * 3 * 1000,
  quiet: false,
  workers: 4,
  retries: 1,
  // It is very important to upload artifacts so that we can trace the test failure
  reporter: [['html', { open: 'never' }]],
  use: {
    trace: 'on',
    video: 'on',
  },
});
