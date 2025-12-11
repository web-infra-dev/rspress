import path from 'node:path';
import { pluginVue } from '@rsbuild/plugin-vue';
import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    pluginPreview({
      iframeOptions: {
        customEntry: ({ demoPath }) => {
          if (demoPath.endsWith('.vue')) {
            return `
import { createApp } from 'vue';
import App from ${JSON.stringify(demoPath)};
createApp(App).mount('#root');
`;
          }
          return `
import { createRoot } from 'react-dom/client';
import Demo from ${JSON.stringify(demoPath)};
const container = document.getElementById('root');
createRoot(container).render(<Demo />);
`;
        },
        builderConfig: {
          plugins: [pluginVue()],
        },
      },
      previewLanguages: ['jsx', 'tsx', 'vue'],
    }),
  ],
});
