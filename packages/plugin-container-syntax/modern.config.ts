import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
  buildConfig: {
    buildType: 'bundle',
    format: 'esm',
    sourceMap: true,
    target: 'esnext',
    dts: {
      respectExternal: false,
    },
  },
  plugins: [moduleTools()],
});
