import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  siteOrigin: 'https://example.com',
  base: '/docs/',
  builderConfig: {
    plugins: [
      {
        name: 'verify-sitemap-post-processing',
        setup(api) {
          api.onAfterBuild(async ({ environments }) => {
            const output = environments.web.distPath;
            const xml = await readFile(
              path.join(output, 'sitemap.xml'),
              'utf8',
            ).catch(error => {
              if (error.code === 'ENOENT') return undefined;
              throw error;
            });
            if (xml !== undefined) {
              await writeFile(path.join(output, 'sitemap-observed.xml'), xml);
            }
          });
        },
      },
    ],
  },
  sitemap: {
    defaultPriority: '0.7',
    defaultChangeFreq: 'weekly',
    customMaps: {
      '/': { loc: 'https://example.com/docs/', lastmod: '2026-01-01' },
    },
  },
});
