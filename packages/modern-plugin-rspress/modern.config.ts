import { defineConfig, moduleTools } from '@modern-js/module-tools';

// https://modernjs.dev/module-tools/en/api
export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    format: 'cjs',
    target: 'es2020',
    sourceMap: true,
    externals: ['@modern-js/module-tools'],
  },
  plugins: [moduleTools()],
});
