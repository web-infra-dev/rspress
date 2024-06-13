import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { defineConfig, moduleTools } from '@modern-js/module-tools';
import { tailwindConfig } from './tailwind.config';

const require = createRequire(import.meta.url);
const tailwindPlugin = require('@modern-js/plugin-tailwindcss').default;

const COMMON_EXTERNALS = [
  'virtual-routes-ssr',
  'virtual-routes',
  'virtual-search-index-hash',
  'virtual-site-data',
  'virtual-global-styles',
  'virtual-global-components',
  'virtual-search-hooks',
  '@rspress/runtime',
  '@theme',
  /@theme-assets\//,
  'virtual-i18n-text',
  'virtual-prism-languages',
];

export default defineConfig({
  plugins: [tailwindPlugin(), moduleTools()],
  testing: {
    transformer: 'ts-jest',
  },
  designSystem: tailwindConfig.theme,
  buildConfig: [
    {
      input: {
        bundle: './src/index.ts',
      },
      copy: {
        patterns: [
          {
            from: './.theme-entry.js',
            to: './index.js',
            context: __dirname,
          },
          {
            from: './.theme-entry.d.ts',
            to: './index.d.ts',
            context: __dirname,
          },
        ],
      },
      outDir: 'dist',
      sourceMap: true,
      format: 'esm',
      externals: COMMON_EXTERNALS,
      asset: {
        svgr: true,
      },
      style: {
        tailwindcss: {
          ...tailwindConfig,
          darkMode: 'class',
        },
        modules: {
          localsConvention: 'camelCase',
          generateScopedName(name, filename) {
            const relative = path
              .relative(__dirname, filename)
              .replace(/\\/g, '/');
            const hash = crypto
              .createHash('sha256')
              .update(relative)
              .digest('hex')
              .slice(0, 5);
            return `${name}_${hash}`;
          },
        },
      },
    },
    {
      buildType: 'bundle',
      input: { 'source-build-plugin': './src/node/source-build-plugin.ts' },
      format: 'esm',
      target: 'es2020',
      outDir: 'dist/node',
      platform: 'node',
      sourceMap: true,
      dts: {},
      externals: ['tailwindcss'],
    },
    // pre-built svg files
    {
      input: ['src/assets'],
      outDir: 'dist/assets',
      asset: {
        svgr: true,
        name: '[name].[ext]',
      },
      dts: false,
      format: 'esm',
      target: 'es2020',
    },
  ],
});
