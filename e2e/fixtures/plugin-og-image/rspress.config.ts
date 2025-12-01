import * as NodePath from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginOgImage } from '@rspress/plugin-og-image';
import fixture from './fixture.json';

export default defineConfig({
  root: NodePath.resolve(__dirname, 'doc'),
  title: fixture.title,
  base: fixture.base,
  plugins: [
    pluginOgImage({
      siteUrl: fixture.siteUrl,
    }),
  ],
});
