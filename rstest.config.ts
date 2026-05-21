import { defineConfig } from '@rstest/core';
import { withRslibConfig } from '@rstest/adapter-rslib';
import { pluginReact } from '@rsbuild/plugin-react';

// Disable color in test
process.env.NO_COLOR = '1';
process.env.FORCE_COLOR = '0';

export default defineConfig({
  extends: withRslibConfig(),
  plugins: [pluginReact()],
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
  tools: {
    rspack(config) {
      config.module ??= {};
      config.module.rules ??= [];
      config.module.rules.push({
        test: /\.(css|sass|scss)$/,
        type: 'asset/source',
      });
    },
  },
});
