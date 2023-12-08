import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
  testing: {
    transformer: 'ts-jest',
  },
  buildPreset: 'npm-library',
  buildConfig: {
    sourceMap: true,
    dts: {
      respectExternal: false,
    },
  },
  plugins: [moduleTools()],
});
