import path from 'path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  markdown: {
    highlightLanguages: [
      ['js', 'javascript'],
      ['oc', 'objectivec'],
      ['mdx', 'tsx'],
    ],
  },
});
