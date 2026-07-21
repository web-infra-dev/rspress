import path from 'node:path';
import { pluginVue } from '@rsbuild/plugin-vue';
import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  plugins: [
    pluginPreview({
      iframeOptions: {
        customEntry: meta => {
          const { demoPath } = meta;
          if (meta.previewMode === 'iframe-fixed') {
            const imports = meta.demos
              .map(
                (demo, index) =>
                  `import Demo_${index} from ${JSON.stringify(
                    demo.sourcePath ?? demo.demoPath,
                  )};`,
              )
              .join('\n');
            const children = meta.demos
              .map((_demo, index) => `h(Demo_${index})`)
              .join(', ');

            return `
import { createApp, h } from 'vue';
${imports}
const App = {
  render() {
    return h('div', {
      class: 'vue-fixed-entry',
      'data-route-path': ${JSON.stringify(meta.route.routePath)},
      'data-lang': ${JSON.stringify(meta.route.lang)},
    }, [${children}]);
  },
};
createApp(App).mount('#root');
`;
          }
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
