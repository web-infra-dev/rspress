import {
  type NavItemWithLink,
  type PageIndexInfo,
  normalizeHref,
} from '@rspress/shared';
import type { LlmsTxt } from './types';

function routePathToMdPath(routePath: string): string {
  let url: string = routePath;
  url = normalizeHref(url, false);
  url = url.replace(/\.html$/, '.md');
  return url;
}

function generateLlmsTxt(
  pageDataArray: PageIndexInfo[][],
  navList: (NavItemWithLink & { lang: string })[],
  others: PageIndexInfo[],
  llmsTxtOptions: LlmsTxt | boolean,
  title: string | undefined,
  description: string | undefined,
): string {
  const lines: string[] = [];
  const { onAfterLlmsTxtGenerate, onLineGenerate, onTitleGenerate } =
    typeof llmsTxtOptions === 'boolean' ? {} : llmsTxtOptions;

  const summary = onTitleGenerate
    ? onTitleGenerate({ title, description })
    : `# ${title}${description ? `\n\n> ${description}` : ''}`;

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
      const { routePath, lang, title, frontmatter } = page;
      if (routePath === '/' || routePath === `/${lang}/`) {
        continue;
      }

      const line = onLineGenerate
        ? onLineGenerate(page)
        : `- [${title}](${routePathToMdPath(routePath)})${frontmatter.description ? `: ${frontmatter.description}` : ''}`;
      lines.push(line);
    }
  }

  // handle others
  let hasOthers = false;
  const otherLines = [];
  otherLines.push('\n## Others\n');
  for (const page of others) {
    const { routePath, lang, title, frontmatter } = page;
    if (routePath === '/' || routePath === `/${lang}/`) {
      continue;
    }
    const line = onLineGenerate
      ? onLineGenerate(page)
      : `- [${title}](${routePathToMdPath(routePath)})${frontmatter.description ? `: ${frontmatter.description}` : ''}`;
    otherLines.push(line);
    hasOthers = true;
  }
  if (hasOthers) {
    lines.push(...otherLines);
  }

  const llmsTxt = `${summary}\n${lines.join('\n')}`;

  return onAfterLlmsTxtGenerate ? onAfterLlmsTxtGenerate(llmsTxt) : llmsTxt;
}

function generateLlmsFullTxt(
  pageDataArray: PageIndexInfo[][],
  navList: (NavItemWithLink & { lang: string })[],
  others: PageIndexInfo[],
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
url: ${routePathToMdPath(page.routePath)}
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
url: ${routePathToMdPath(page.routePath)}
---
`);
    lines.push((page as any).mdContent ?? page._flattenContent ?? page.content);
    lines.push('\n');
  }

  return lines.join('\n');
}

export { generateLlmsTxt, generateLlmsFullTxt };
