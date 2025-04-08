import path from 'node:path';
import { pluginVue } from '@rsbuild/plugin-vue';
import { pluginPreview } from '@rspress/plugin-preview';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    pluginPreview({
      iframeOptions: {
        customEntry: (entryCssPath: string, demoPath: string) => {
          if (demoPath.endsWith('.vue')) {
            return `
import { createApp } from 'vue';
import App from ${JSON.stringify(demoPath)};
import ${JSON.stringify(entryCssPath)};
createApp(App).mount('#root');
`;
          }
          return `
import { render } from 'react-dom';
import ${JSON.stringify(entryCssPath)};
import Demo from ${JSON.stringify(demoPath)};
render(<Demo />, document.getElementById('root'));
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
