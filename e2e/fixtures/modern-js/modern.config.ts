import { moduleTools, defineConfig } from '@modern-js/module-tools';
import { modulePluginDoc } from '@modern-js/plugin-rspress';

export default defineConfig({
  plugins: [
    moduleTools(),
    modulePluginDoc({
      entries: {
        Alert: './src/alert.tsx',
        Button: './src/button.tsx',
      },
      languages: ['zh', 'en'],
      previewMode: 'mobile',
      iframePosition: 'fixed',
      apiParseTool: 'react-docgen-typescript',
      doc: {
        lang: 'en',
        locales: [
          {
            lang: 'en',
            label: 'English',
          },
          {
            lang: 'zh',
            label: '简体中文',
          },
        ],
      },
    }),
  ],
  buildPreset: 'npm-component',
  buildConfig: {
    tsconfig: './tsconfig.build.json',
  },
});
