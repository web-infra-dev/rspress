import { defineConfig, moduleTools } from '@modern-js/module-tools';
// https://modernjs.dev/module-tools/en/api
export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'cjs',
      sourceMap: true,
      input: ['./src/index.ts'],
      target: 'es2020',
      dts: {
        respectExternal: false,
      },
    },
    {
      buildType: 'bundle',
      format: 'cjs',
      sourceMap: true,
      input: ['./src/utils.ts'],
      target: 'es2020',
      dts: {
        respectExternal: false,
      },
    },
  ],
  plugins: [moduleTools()],
});
