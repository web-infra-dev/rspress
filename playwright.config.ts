import { defineConfig } from '@playwright/test';

export default defineConfig({
  // exclude webpack / rspack self-feature test cases when run rspack / webpack test
  testDir: './e2e',
  fullyParallel: false,
  globalTimeout: 60 * 60 * 1000,
  timeout: 60 * 1000,
  quiet: true,
  workers: 4,
  reporter: process.env.CI ? 'github' : 'list',
});
