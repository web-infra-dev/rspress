import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginOpenAPI } from '@rspress/plugin-openapi';
import { fixture } from '../../../../packages/plugin-openapi/src/fixture';
export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  title: 'OpenAPI Example',
  themeConfig: { nav: [{ text: 'API', link: '/api/getallplanets' }] },
  plugins: [pluginOpenAPI({ input: fixture })],
});
