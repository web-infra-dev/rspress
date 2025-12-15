import { defineConfig } from '@rstest/core';

// Disable color in test
process.env.NO_COLOR = '1';
process.env.FORCE_COLOR = '0';

export default defineConfig(
  {
    name: 'node',
    globals: false,
    testEnvironment: 'node',
    testTimeout: 30000,
    include: ['packages/**/*.test.{ts,tsx}'],
    exclude: ['**/node_modules/**'],
    setupFiles: ['./scripts/test-helper/rstest.setup.ts'],
    output: {
      module: true,
    },
  }
);
