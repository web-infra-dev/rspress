import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
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
