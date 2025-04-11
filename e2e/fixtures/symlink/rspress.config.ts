import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  builderConfig: {
    tools: {
      rspack: {
        resolve: {
          symlinks: false,
        },
      },
    },
  },
  markdown: {
    mdxRs: false,
  },
  ssg: {
    fallback: false,
  },
});
