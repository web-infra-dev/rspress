import * as path from 'node:path';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  globalStyles: path.join(import.meta.dirname, 'tailwind.css'),
  builderConfig: {
    plugins: [pluginTailwindcss()],
  },
});
