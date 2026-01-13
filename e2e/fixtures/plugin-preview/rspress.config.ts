import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';
import { getPort } from '../../../e2e/utils/runCommands';

export default defineConfig(async () => {
  const port = await getPort();
  return {
    root: path.join(__dirname, 'doc'),
    plugins: [
      pluginPreview({
        iframeOptions: {
          devPort: port,
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
  };
});
