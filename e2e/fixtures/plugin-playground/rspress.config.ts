import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginPlayground } from '@rspress/plugin-playground';
import { ProbePlugin } from '../../utils/probe.ts';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  plugins: [pluginPlayground({ defaultRenderMode: 'playground' })],
  builderConfig: {
    tools: {
      rspack: (_config, { appendPlugins }) => {
        appendPlugins(new ProbePlugin(import.meta.dirname, ['doc/index.mdx']));
      },
    },
  },
});
