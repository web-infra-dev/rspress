import { defineConfig } from '@rstest/core';
import { pluginSass } from '@rsbuild/plugin-sass';

// Disable color in test
process.env.NO_COLOR = '1';
process.env.FORCE_COLOR = '0';

export default defineConfig({
  projects: [{
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
  },
  {
    name: 'web-component',
    globals: false,
    testEnvironment: 'node',
    testTimeout: 30000,
    include: ['packages/**/*.spec.{ts,tsx}'],
    exclude: ['**/node_modules/**'],
    setupFiles: ['./scripts/test-helper/rstest.setup.ts'],
    output: {
      module: true,
    },
    tools: {
      swc: {
        jsc: {
          transform: {
            react: {
              runtime: 'automatic'
            }
          }
        }
      }
    },
    plugins: [
      pluginSass(),
    ],
  }
  ]
}
  
);
