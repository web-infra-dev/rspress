import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginOpenAPI } from '@rspress/plugin-openapi';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc-readonly'),
  plugins: [pluginOpenAPI({ input: './readonly.yaml', playground: false })],
});
