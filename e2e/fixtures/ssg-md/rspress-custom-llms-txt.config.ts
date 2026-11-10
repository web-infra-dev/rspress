import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  base: '/docs/',
  siteOrigin: 'https://example.com',
  ssg: true,
  llms: {
    async llmsTxt({
      title,
      description,
      lang,
      version,
      base,
      siteOrigin,
      sections,
    }) {
      const sectionContent = sections
        .map(section => {
          const pages = section.pages
            .map(
              page =>
                `- [${page.title}](${page.link}) (${page.routePath}, ${page.lang}, ${page.version || 'default'})`,
            )
            .join('\n');
          return `## ${section.title}\n\n${pages}`;
        })
        .join('\n\n');

      return `# Custom ${title}

> ${description}

- Language: ${lang}
- Version: ${version || 'default'}
- Base: ${base}
- Site origin: ${siteOrigin}

${sectionContent}`;
    },
  },
  title: 'Rspress SSG MDX Test',
  description: 'Rspress SSG MDX Test Description',
  themeConfig: {
    nav: [
      {
        text: 'Docs',
        link: '/components',
      },
    ],
  },
  markdown: {
    link: {
      checkDeadLinks: false,
    },
  },
});
