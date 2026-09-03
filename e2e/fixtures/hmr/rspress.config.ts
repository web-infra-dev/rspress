import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { ProbePlugin } from '../../utils/probe.ts';
import { siteConfig } from './siteConfig.ts';

export default defineConfig({
  ...siteConfig,
  root: path.join(import.meta.dirname, 'doc'),
  builderConfig: {
    tools: {
      rspack: (_config, { appendPlugins }) => {
        appendPlugins(
          new ProbePlugin(import.meta.dirname, [
            'doc/guide/test.mdx',
            'doc/guide/_mdx-fragment.mdx',
            'doc/_nav.json',
            'doc/guide/_meta.json',
          ]),
        );
      },
    },
  },
});
