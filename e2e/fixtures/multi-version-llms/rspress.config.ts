import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'docs'),
  lang: 'en',
  ssg: true,
  llms: {
    llmsTxt: ({ title, lang, version, sections }) => {
      const links = sections
        .flatMap(section => section.pages)
        .map(page => `- [${page.title}](${page.link})`)
        .join('\n');
      return `# ${title}

lang: ${lang}
version: ${version}

${links}`;
    },
  },
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
