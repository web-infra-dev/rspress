import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import path from 'node:path';
import { defineConfig, moduleTools } from '@modern-js/module-tools';
import tailwindConfig from './tailwind.config';

const COMMON_EXTERNALS = [
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
  // To be externalized when bundling d.ts.
  '@types/react',
];

export default defineConfig({
  plugins: [moduleTools()],
  buildConfig: {
    buildType: 'bundleless',
    format: 'esm',
    sourceDir: 'src',
    input: ['src/**/*.{tsx,ts,svg}', '!src/**/*.test.{tsx,ts}'],
    outDir: 'dist',
    externals: COMMON_EXTERNALS,
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
    asset: {
      svgr: true,
    },
  },
});
