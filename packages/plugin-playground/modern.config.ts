import { defineConfig, moduleTools } from '@modern-js/module-tools';
// https://modernjs.dev/module-tools/en/api
export default defineConfig({
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'cjs',
      sourceMap: true,
      input: ['./src/cli/index.ts'],
      target: 'es2020',
      dts: false,
      outDir: 'dist/cli/cjs',
    },
    {
      buildType: 'bundle',
      format: 'esm',
      sourceMap: true,
      input: ['./src/cli/index.ts'],
      target: 'es2020',
      dts: {
        respectExternal: false,
      },
      outDir: 'dist/cli/esm',
    },
    {
      buildType: 'bundle',
      format: 'cjs',
      sourceMap: true,
      input: ['./src/web/index.ts'],
      target: 'es2020',
      dts: false,
      outDir: 'dist/web/cjs',
    },
    {
      buildType: 'bundle',
      format: 'esm',
      sourceMap: true,
      input: ['./src/web/index.ts'],
      target: 'es2020',
      dts: {
        respectExternal: false,
      },
      outDir: 'dist/web/esm',
    },
  ],
  plugins: [moduleTools()],
});
