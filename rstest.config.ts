import { defineConfig } from '@rstest/core';

// Disable color in test
process.env.NO_COLOR = '1';

export default defineConfig(
  {
    name: 'node',
    globals: true,
    testEnvironment: 'node',
    testTimeout: 30000,
    include: ['packages/**/*.test.ts'],
    exclude: ['**/node_modules/**'],
    setupFiles: ['./scripts/test-helper/rstest.setup.ts'],
    output: {
      externals: ['virtual-routes']
    },
  }
);
