import path from 'path';
import crypto from 'crypto';
import { createRequire } from 'module';
import { defineConfig, moduleTools } from '@modern-js/module-tools';
import { tailwindConfig } from './tailwind.config';

const require = createRequire(import.meta.url);
const tailwindPlugin = require('@modern-js/plugin-tailwindcss').default;

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
  plugins: [tailwindPlugin(), moduleTools()],
  testing: {
    transformer: 'ts-jest',
  },
  designSystem: tailwindConfig.theme,
  buildConfig: [
    {
      buildType: 'bundle',
      format: 'esm',
      target: 'es2020',
      outDir: 'dist',
      sourceMap: true,
      externals: [
        '@rspress/mdx-rs',
        'jsdom',
        '@rspress/plugin-container-syntax',
      ],
      esbuildOptions: options => {
        options.banner = {
          js: 'import { createRequire } from "module";\nconst { url } = import.meta;\nconst require = createRequire(url);',
        };
        return options;
      },
    },
    {
      input: {
        loader: './src/node/mdx/loader.ts',
      },
      buildType: 'bundle',
      format: 'esm',
      target: 'es2020',
      outDir: 'dist',
      sourceMap: true,
      externals: ['@rspress/mdx-rs'],
      esbuildOptions: options => {
        options.banner = {
          js: 'import { createRequire } from "module";\nconst { url } = import.meta;\nconst require = createRequire(url);',
        };
        return options;
      },
    },
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
    {
      input: {
        bundle: './src/theme-default/index.ts',
      },
      copy: {
        patterns: [
          {
            from: './.theme-entry.js',
            to: './index.js',
            context: __dirname,
          },
        ],
      },
      outDir: 'dist/theme',
      sourceMap: true,
      format: 'esm',
      externals: COMMON_EXTERNALS,
      asset: {
        svgr: true,
      },
      style: {
        tailwindcss: {
          // ...tailwindConfig,
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
  ],
});
