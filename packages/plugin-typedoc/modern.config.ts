import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
  testing: {
    transformer: 'ts-jest',
  },
  buildConfig: {
    format: 'esm',
    sourceMap: true,
    buildType: 'bundle',
    dts: {
      respectExternal: false,
    },
  },
  plugins: [moduleTools()],
});
