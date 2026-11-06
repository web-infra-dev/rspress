import { defineConfig } from '@rstest/core';

const isCI = Boolean(process.env.CI);

export default defineConfig({
  name: 'e2e',
  globals: false,
  testEnvironment: 'node',
  include: ['e2e/**/*.test.{ts,mjs}'],
  exclude: ['**/node_modules/**'],
  output: {
    externals: ['@rspress/core'],
  },
  testTimeout: 60 * 1000,
  hookTimeout: 60 * 1000,
  expect: {
    poll: {
      timeout: 5000,
    },
  },
  retry: isCI ? 3 : 0,
  isolate: false,
  pool: {
    maxWorkers: isCI ? 2 : '50%',
  },
  silent: true,
});
