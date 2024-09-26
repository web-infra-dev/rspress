import { defineConfig, moduleTools } from '@modern-js/module-tools';

export default defineConfig({
  testing: {
    transformer: 'ts-jest',
  },
  buildConfig: {
    buildType: 'bundle',
    format: 'esm',
    target: 'es2021',
    sourceMap: true,
    shims: true,
    dts: {
      respectExternal: false,
    },
  },
  plugins: [moduleTools()],
});
