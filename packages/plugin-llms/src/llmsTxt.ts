import type { NavItemWithLink, PageIndexInfo } from '@rspress/shared';

function generateLlmsTxt(
  obj: Record<string, PageIndexInfo[]>,
  navList: [string, NavItemWithLink][],
): string {
  const lines: string[] = [];

  // generate llms.txt with obj
  for (const [activeMatch, nav] of navList) {
    const pages = obj[activeMatch];
    if (pages.length === 0) {
      continue;
    }
    const title = nav.text;
    lines.push(`# ${title}`);

    for (const page of pages) {
      const content = page.flattenContent ?? page.content;
      const title = page.title;
      lines.push(`## ${title}`);
      lines.push(content);
      lines.push('');
    }
  }

  return lines.join('\n');
}

export { generateLlmsTxt };
