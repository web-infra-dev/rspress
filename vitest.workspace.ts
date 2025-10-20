import { Console } from 'node:console';
import { defineWorkspace } from 'vitest/config';

// Disable color in test
process.env.NO_COLOR = '1';
process.env.FORCE_COLOR = '0';

// mock Console
global.console.Console = Console;

export default defineWorkspace([
  {
    test: {
      name: 'node',
      globals: false,
      environment: 'node',
      testTimeout: 30000,
      // restoreMocks: true,
      include: ['packages/**/*.test.{ts,tsx}'],
      exclude: ['**/node_modules/**'],
      setupFiles: ['./scripts/test-helper/vitest.setup.ts'],
    },
  },
]);
