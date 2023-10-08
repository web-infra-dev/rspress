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
    }),
  ],
  buildPreset: 'npm-component',
});
