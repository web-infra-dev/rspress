import {
  type LlmsTxtPage,
  type LlmsTxtRenderer,
  type LlmsTxtSection,
  type NavItemWithLink,
  normalizeHref,
  withBase,
  withSiteOrigin,
} from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { extractInfoFromFrontmatterWithAbsolutePath } from '../../auto-nav-sidebar/utils';
import type { RouteService } from '../../route/RouteService';

function routePathToMdPath(
  routePath: string,
  base: string,
  siteOrigin?: string,
): string {
  let url: string = routePath;
  url = normalizeHref(url, false);
  url = url.replace(/\.html$/, '.md');
  return withSiteOrigin(withBase(url, base), siteOrigin);
}

async function generateLlmsTxt(
  routeGroups: string[][],
  others: string[],
  navList: { text: string }[],
  title: string | undefined,
  description: string | undefined,
  base: string,
  siteOrigin: string | undefined,
  routeService: RouteService,
  lang: string,
  version: string,
  renderLlmsTxt?: LlmsTxtRenderer,
): Promise<string> {
  async function generateSection(
    sectionTitle: string,
    routes: string[],
  ): Promise<LlmsTxtSection | undefined> {
    if (routes.length === 0) {
      return;
    }

    const pages: LlmsTxtPage[] = (
      await Promise.all(
        routes.map(async (route): Promise<LlmsTxtPage | undefined> => {
          const routePage = routeService.getRoutePageByRoutePath(route)!;
          const {
            lang: pageLang,
            routePath,
            pureRoutePath,
            absolutePath,
            version: pageVersion,
          } = routePage.routeMeta;
          if (pureRoutePath === '/') {
            return;
          }

          // Prefer pageIndexInfo from RoutePage (set by extractPageData), but
          // non-MDX pages have an empty indexed title and need file fallback.
          const pageInfo = routePage.pageIndexInfo;
          let title = pageInfo?.title;
          let description = pageInfo?.description;

          if (!title) {
            const info = await extractInfoFromFrontmatterWithAbsolutePath(
              absolutePath,
              routeService.getDocsDir(),
            );
            title = info.title;
            description ??= info.description;
          }

          return {
            routePath,
            link: routePathToMdPath(routePath, base, siteOrigin),
            title,
            description,
            frontmatter: pageInfo?.frontmatter ?? {},
            lang: pageLang,
            version: pageVersion,
          };
        }),
      )
    ).filter((page): page is LlmsTxtPage => Boolean(page));

    if (pages.length === 0) {
      return;
    }

    return {
      title: sectionTitle,
      pages,
    };
  }

  const navSections = await Promise.all(
    navList.map(async (nav, i) => {
      const routes = routeGroups[i];
      return generateSection(nav.text, routes);
    }),
  );
  const otherSection = await generateSection('Others', others);
  const sections = [...navSections, otherSection].filter(
    (section): section is LlmsTxtSection => Boolean(section),
  );

  if (renderLlmsTxt) {
    return renderLlmsTxt({
      title,
      description,
      lang,
      version,
      base,
      siteOrigin,
      sections,
    });
  }

  if (!title) {
    logger.warn(
      'No `title` is configured in your Rspress setup. Please set `title` in rspress.config.ts so llms.txt can include an appropriate heading.',
    );
  }

  const summary = title
    ? `# ${title}${description ? `\n\n> ${description}` : ''}`
    : '';
  const lines: string[] = [];
  for (const section of sections) {
    lines.push(`\n## ${section.title}\n`);
    lines.push(
      ...section.pages.map(
        page =>
          `- [${page.title}](${page.link})${page.description ? `: ${page.description}` : ''}`,
      ),
    );
  }

  let llmsTxt: string;
  if (summary) {
    llmsTxt = lines.length > 0 ? `${summary}\n${lines.join('\n')}` : summary;
  } else {
    llmsTxt = lines.join('\n').trimStart();
  }

  return llmsTxt;
}

function generateLlmsFullTxt(
  routeGroups: string[][],
  navList: (NavItemWithLink & { lang: string })[],
  others: string[],
  base: string,
  siteOrigin: string | undefined,
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
url: ${routePathToMdPath(routePath, base, siteOrigin)}
---
`);
      lines.push(mdContents.get(routePath) ?? '');
      lines.push('\n');
    }
  }
  for (const routePath of others) {
    lines.push(`---
url: ${routePathToMdPath(routePath, base, siteOrigin)}
---
`);
    lines.push(mdContents.get(routePath) ?? '');
    lines.push('\n');
  }

  return lines.join('\n');
}

export { generateLlmsFullTxt, generateLlmsTxt, routePathToMdPath };
