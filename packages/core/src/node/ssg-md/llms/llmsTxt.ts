import { type NavItemWithLink, normalizeHref, withBase } from '@rspress/shared';
import { extractInfoFromFrontmatterWithAbsolutePath } from '../../auto-nav-sidebar/utils';
import type { RouteService } from '../../route/RouteService';

function routePathToMdPath(routePath: string, base: string): string {
  let url: string = routePath;
  url = normalizeHref(url, false);
  url = url.replace(/\.html$/, '.md');
  return withBase(url, base);
}

async function generateLlmsTxt(
  routeGroups: string[][],
  others: string[],
  navList: { text: string }[],
  title: string | undefined,
  description: string | undefined,
  base: string,
  routeService: RouteService,
): Promise<string> {
  const lines: string[] = [];

  const summary = `# ${title}${description ? `\n\n> ${description}` : ''}`;

  async function genH2Part(
    nav: { text: string },
    routes: string[],
  ): Promise<string[]> {
    const lines: string[] = [];
    const { text } = nav;
    if (routes.length === 0) {
      return lines;
    }

    const routeLines: string[] = (
      await Promise.all(
        routes.map(async route => {
          const routePage = routeService.getRoutePageByRoutePath(route)!;
          const { lang, routePath, absolutePath } = routePage.routeMeta;
          if (routePath === '/' || routePath === `/${lang}/`) {
            return;
          }

          const { title, description } =
            await extractInfoFromFrontmatterWithAbsolutePath(
              absolutePath,
              routeService.getDocsDir(),
            );

          return `- [${title}](${routePathToMdPath(routePath, base)})${description ? `: ${description}` : ''}`;
        }),
      )
    ).filter((i): i is string => Boolean(i));
    if (routeLines.length > 0) {
      const title = text;
      lines.push(`\n## ${title}\n`);
      lines.push(...routeLines);
    }

    return lines;
  }

  const h2Parts = await Promise.all(
    navList.map(async (nav, i) => {
      const routes = routeGroups[i];
      const h2Part = await genH2Part(nav, routes);
      return h2Part;
    }),
  );
  lines.push(...h2Parts.flat());

  // handle others
  const otherLines = await genH2Part(
    {
      text: 'Others',
    },
    others,
  );
  lines.push(...otherLines);
  const llmsTxt = `${summary}\n${lines.join('\n')}`;

  return llmsTxt;
}

function generateLlmsFullTxt(
  routeGroups: string[][],
  navList: (NavItemWithLink & { lang: string })[],
  others: string[],
  base: string,
  mdContents: Map<string, string>,
): string {
  const lines: string[] = [];
  // generate llms.txt with obj
  for (let i = 0; i < navList.length; i++) {
    const routeGroup = routeGroups[i];
    if (routeGroup.length === 0) {
      continue;
    }
    for (const routePath of routeGroup) {
      lines.push(`---
url: ${routePathToMdPath(routePath, base)}
---
`);
      lines.push(mdContents.get(routePath) ?? '');
      lines.push('\n');
    }
  }
  for (const routePath of others) {
    lines.push(`---
url: ${routePathToMdPath(routePath, base)}
---
`);
    lines.push(mdContents.get(routePath) ?? '');
    lines.push('\n');
  }

  return lines.join('\n');
}

export { generateLlmsFullTxt, generateLlmsTxt, routePathToMdPath };
