import path from 'node:path';
import { pluginVue } from '@rsbuild/plugin-vue';
import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  plugins: [
    pluginPreview({
      iframeOptions: {
        devPort: Number(process.env.RSPRESS_E2E_PREVIEW_PORT) || 7890,
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
