import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';
import { ProbePlugin } from '../../utils/probe.ts';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  builderConfig: {
    tools: {
      rspack: (_config, { appendPlugins }) => {
        appendPlugins(new ProbePlugin(import.meta.dirname, ['doc/hmr.mdx']));
      },
    },
  },
  plugins: [
    pluginPreview({
      iframeOptions: {
        framework: 'react',
      },
      defaultPreviewMode: 'iframe-fixed',
      defaultRenderMode: 'preview',
      previewLanguages: ['jsx', 'tsx', 'json'],
      previewCodeTransform(codeInfo) {
        if (codeInfo.language === 'json') {
          return `
import React from 'react';

const json = ${codeInfo.code};

export default function() {
  return React.createElement(json.type, null, json.children);
}
`;
        }
        return codeInfo.code;
      },
    }),
  ],
});
