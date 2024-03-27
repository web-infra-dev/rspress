import {
  PartialBaseBuildConfig,
  defineConfig,
  moduleTools,
} from '@modern-js/module-tools';

const base = {
  buildType: 'bundle',
  format: 'cjs',
  sourceMap: true,
  target: 'es2020',
} satisfies PartialBaseBuildConfig;

// https://modernjs.dev/module-tools/en/api
export default defineConfig({
  buildConfig: [
    {
      ...base,
      format: 'cjs',
      dts: false,
      esbuildOptions: options => ({
        ...options,
        outExtension: { '.js': '.cjs' },
      }),
    },
    { ...base, format: 'esm', dts: false, autoExtension: true },
    {
      ...base,
      format: 'esm',
      dts: { respectExternal: false, only: true },
    },
  ],
  plugins: [moduleTools()],
});
