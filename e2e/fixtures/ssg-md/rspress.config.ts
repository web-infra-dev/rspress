import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  ssg: true,
  llms: true,
  title: 'Rspress SSG MDX Test',
  description: 'Rspress SSG MDX Test Description',
  markdown: {
    link: {
      checkDeadLinks: false,
    },
  },
});
