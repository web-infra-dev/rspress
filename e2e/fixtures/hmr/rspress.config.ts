import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { ProbePlugin } from './probe.ts';
import { siteConfig } from './siteConfig.ts';

export default defineConfig({
  ...siteConfig,
  root: path.join(import.meta.dirname, 'doc'),
  builderConfig: {
    tools: {
      rspack: (_config, { appendPlugins }) => {
        appendPlugins(new ProbePlugin());
      },
    },
  },
});
