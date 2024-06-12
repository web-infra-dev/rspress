import { createRequire } from 'node:module';
import { defineConfig, moduleTools } from '@modern-js/module-tools';
import { tailwindConfig } from './tailwind.config';

const require = createRequire(import.meta.url);
const tailwindPlugin = require('@modern-js/plugin-tailwindcss').default;

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
        'tailwindcss',
        '@rspress/plugin-container-syntax',
        '../compiled/globby/index.js',
      ],
      banner: {
        js: 'import { createRequire } from "module";\nconst { url } = import.meta;\nconst require = createRequire(url);',
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
      banner: {
        js: 'import { createRequire } from "module";\nconst { url } = import.meta;\nconst require = createRequire(url);',
      },
    },
    {
      sourceDir: 'src/runtime',
      buildType: 'bundleless',
      target: 'es2020',
      format: 'esm',
      outDir: 'dist/runtime',
      tsconfig: './src/runtime/tsconfig.json',
    },
  ],
});
