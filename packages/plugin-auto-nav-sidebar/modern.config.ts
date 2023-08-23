import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
  testing: {
    transformer: 'ts-jest',
  },
  buildConfig: {
    buildType: 'bundle',
    format: 'esm',
    sourceMap: true,
    dts: {
      respectExternal: false,
    },
  },
  plugins: [moduleTools()],
});
