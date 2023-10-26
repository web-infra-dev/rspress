import { defineConfig, moduleTools } from '@modern-js/module-tools';

const COMMON_EXTERNALS = [
  'virtual-routes-ssr',
  'virtual-routes',
  '@theme',
  'virtual-search-index-hash',
  'virtual-site-data',
  'virtual-global-styles',
  'virtual-global-components',
  'virtual-search-hooks',
  '@/runtime',
  '@runtime',
  'virtual-i18n-text',
  'virtual-prism-languages',
];

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: [
    {
      input: ['src/runtime'],
      sourceDir: 'src/runtime',
      buildType: 'bundleless',
      target: 'es2020',
      format: 'esm',
      outDir: 'dist/runtime',
      dts: {
        tsconfigPath: './src/runtime/tsconfig.json',
        respectExternal: true,
      },
      tsconfig: './src/runtime/tsconfig.json',
      externals: COMMON_EXTERNALS,
    },
  ],
});
