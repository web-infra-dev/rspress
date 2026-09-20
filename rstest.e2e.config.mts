import { defineConfig } from '@rstest/core';
import { definePlaywrightConfig } from '@rstest/playwright/config';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  name: 'e2e',
  extends: definePlaywrightConfig({
    launchOptions: isCI ? { channel: 'chrome' } : {},
    contextOptions: {
      viewport: { width: 1440, height: 900 },
    },
    trace: isCI ? 'on-first-retry' : 'on',
  }),
  globals: false,
  testEnvironment: 'node',
  include: ['e2e/**/*.test.{ts,mjs}'],
  exclude: ['**/node_modules/**'],
  output: {
    externals: ['@rspress/core'],
  },
  testTimeout: 60 * 1000,
  hookTimeout: 60 * 1000,
  retry: isCI ? 3 : 0,
  isolate: false,
  pool: {
    maxWorkers: isCI ? 2 : '50%',
  },
  silent: true,
});
