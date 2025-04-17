import type { NavItemWithLink, PageIndexInfo } from '@rspress/shared';

function generateLlmsTxt(
  pageDataArray: PageIndexInfo[][],
  navList: NavItemWithLink[],
): string {
  const lines: string[] = [];

  // generate llms.txt with obj
  for (let i = 0; i < navList.length; i++) {
    const nav = navList[i];
    const pages = pageDataArray[i];
    const { text } = nav;
    if (pages.length === 0) {
      continue;
    }
    const title = text;
    lines.push(`# ${title}\n`);

    for (const page of pages) {
      lines.push(
        `[${page.title}](${page.routePath.replace(/\.html$/, '.md')})`,
      );
      lines.push('');
    }
  }

  return lines.join('\n');
}

function generateLlmsFullTxt(
  pageDataArray: PageIndexInfo[][],
  navList: NavItemWithLink[],
): string {
  const lines: string[] = [];
  // generate llms.txt with obj
  for (let i = 0; i < navList.length; i++) {
    const nav = navList[i];
    const pages = pageDataArray[i];
    if (pages.length === 0) {
      continue;
    }
    const title = nav.text;
    lines.push(`# ${title}\n`);
    for (const page of pages) {
      lines.push(
        (page as any).mdContent ?? page.flattenContent ?? page.content,
      );
      lines.push('\n');
    }
  }
  return lines.join('\n');
}

export { generateLlmsTxt, generateLlmsFullTxt };
