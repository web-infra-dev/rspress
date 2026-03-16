import {
  logger,
  type NavItemWithLink,
  normalizeHref,
  type PageIndexInfo,
  withBase,
} from '@rspress/core';
import type { LlmsTxt } from './types';

function routePathToMdPath(routePath: string, base: string): string {
  let url: string = routePath;
  url = normalizeHref(url, false);
  url = url.replace(/\.html$/, '.md');
  return withBase(url, base);
}

function generateLlmsTxt(
  pageDataArray: PageIndexInfo[][],
  navList: (NavItemWithLink & { lang: string })[],
  others: PageIndexInfo[],
  llmsTxtOptions: LlmsTxt,
  title: string | undefined,
  description: string | undefined,
  base: string,
): string {
  const lines: string[] = [];
  const { onAfterLlmsTxtGenerate, onLineGenerate, onTitleGenerate } =
    llmsTxtOptions;

  if (!onTitleGenerate && !title) {
    logger.warn(
      'No `title` is configured in your Rspress setup. Please set `title` in rspress.config.ts so llms.txt can include an appropriate heading.',
    );
  }

  const summary = onTitleGenerate
    ? onTitleGenerate({ title, description })
    : title
      ? `# ${title}${description ? `\n\n> ${description}` : ''}`
      : '';

  for (let i = 0; i < navList.length; i++) {
    const nav = navList[i];
    const pages = pageDataArray[i];
    const { text } = nav;
    if (pages.length === 0) {
      continue;
    }
    const title = text;
    lines.push(`\n## ${title}\n`);

    for (const page of pages) {
      const { routePath, lang, title, description } = page;
      if (routePath === '/' || routePath === `/${lang}/`) {
        continue;
      }

      const line = onLineGenerate
        ? onLineGenerate(page)
        : `- [${title}](${routePathToMdPath(routePath, base)})${description ? `: ${description}` : ''}`;
      lines.push(line);
    }
  }

  // handle others
  let hasOthers = false;
  const otherLines = [];
  otherLines.push('\n## Other\n');
  for (const page of others) {
    const { routePath, lang, title, description } = page;
    if (routePath === '/' || routePath === `/${lang}/`) {
      continue;
    }
    const line = onLineGenerate
      ? onLineGenerate(page)
      : `- [${title}](${routePathToMdPath(routePath, base)})${description ? `: ${description}` : ''}`;
    otherLines.push(line);
    hasOthers = true;
  }
  if (hasOthers) {
    lines.push(...otherLines);
  }

  let llmsTxt: string;
  if (summary) {
    llmsTxt = lines.length > 0 ? `${summary}\n${lines.join('\n')}` : summary;
  } else {
    llmsTxt = lines.join('\n').trimStart();
  }

  return onAfterLlmsTxtGenerate ? onAfterLlmsTxtGenerate(llmsTxt) : llmsTxt;
}

function generateLlmsFullTxt(
  pageDataArray: PageIndexInfo[][],
  navList: (NavItemWithLink & { lang: string })[],
  others: PageIndexInfo[],
  base: string,
): string {
  const lines: string[] = [];
  // generate llms.txt with obj
  for (let i = 0; i < navList.length; i++) {
    const pages = pageDataArray[i];
    if (pages.length === 0) {
      continue;
    }
    for (const page of pages) {
      lines.push(`---
url: ${routePathToMdPath(page.routePath, base)}
---
`);
      lines.push(
        (page as any).mdContent ?? page._flattenContent ?? page.content,
      );
      lines.push('\n');
    }
  }
  for (const page of others) {
    lines.push(`---
url: ${routePathToMdPath(page.routePath, base)}
---
`);
    lines.push((page as any).mdContent ?? page._flattenContent ?? page.content);
    lines.push('\n');
  }

  return lines.join('\n');
}

export { generateLlmsFullTxt, generateLlmsTxt, routePathToMdPath };
