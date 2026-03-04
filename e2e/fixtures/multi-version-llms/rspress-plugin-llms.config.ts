import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginLlms } from '@rspress/plugin-llms';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  lang: 'en',
  ssg: false,
  title: 'Multi Version Plugin LLMS Test',
  description: 'Test multi-version with plugin-llms',
  locales: [
    {
      lang: 'en',
      label: 'English',
    },
    {
      lang: 'zh',
      label: '简体中文',
    },
  ],
  multiVersion: {
    default: 'v1',
    versions: ['v1', 'v2'],
  },
  plugins: [pluginLlms()],
});
