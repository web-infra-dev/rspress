import { defineConfig } from '@rstest/core';
import { withRslibConfig } from '@rstest/adapter-rslib';
import path from 'node:path';

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
    name: 'node-ssg-md',
    globals: false,
    testEnvironment: 'node',
    testTimeout: 30000,
    include: ['packages/**/*.spec.{ts,tsx}'],
    exclude: ['**/node_modules/**'],
    setupFiles: ['./scripts/test-helper/rstest.setup.ts'],
    output: {
      module: true,
    },
     extends: async (user) => {
    const config = await withRslibConfig({
      configPath: path.join(__dirname, 'rslib.config.ts'),
      libId: 'theme-ssg-md',
    })(user);
    console.log('Extended config:', JSON.stringify(config, null, 2));
    return config;
  },
    // extends: withRslibConfig(),
    env: {
      __SSR_MD__: 'true',
      SSG_MD: 'true',
    }
  }
  ]
}
  
);
