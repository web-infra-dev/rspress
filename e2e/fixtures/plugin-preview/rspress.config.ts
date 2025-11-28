import path from 'node:path';
import { pluginLess } from '@rsbuild/plugin-less';
import { pluginPreview } from '@rspress/plugin-preview';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    pluginPreview({
      isMobile: true,
      iframeOptions: {
        framework: 'react',
        position: 'fixed',
        builderConfig: {
          plugins: [
            pluginLess({
              lessLoaderOptions: {
                lessOptions: {
                  modifyVars: {
                    '@color-1': '#ff0000',
                  },
                  javascriptEnabled: true,
                },
              },
            }),
          ],
        },
      },
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
