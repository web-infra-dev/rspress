import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  lang: 'en',
  ssg: true,
  llms: true,
  title: 'Multi Version LLMS Test',
  description: 'Test multi-version with SSG-MD llms',
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
});
