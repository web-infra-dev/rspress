import { defineConfig, moduleTools } from '@modern-js/module-tools';
// https://modernjs.dev/module-tools/en/api
export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'cjs',
      sourceMap: true,
      target: 'es2020',
      dts: {
        respectExternal: false,
      },
    },
  ],
  plugins: [moduleTools()],
});
