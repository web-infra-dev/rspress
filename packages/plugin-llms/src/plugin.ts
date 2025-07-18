import path from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { getSidebarDataGroup } from '@rspress/core';
import { logger } from '@rspress/core';
import type {
  Nav,
  NavItemWithLink,
  PageIndexInfo,
  RouteMeta,
  RspressPlugin,
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarSectionHeader,
} from '@rspress/core';
import type { RouteService } from '@rspress/core';
import { matchPath } from '@rspress/core';
import { generateLlmsFullTxt, generateLlmsTxt } from './llmsTxt';
import { mdxToMd } from './mdxToMd';
import type {
  Options,
  RspressPluginLlmsOptions,
  rsbuildPluginLlmsOptions,
} from './types';

const rsbuildPluginLlms = ({
  disableSSGRef,
  baseRef,
  pageDataList,
  routes,
  titleRef,
  descriptionRef,
  langRef,
  sidebar,
  routeServiceRef,
  nav,
  rspressPluginOptions,
  index = 0,
}: rsbuildPluginLlmsOptions): RsbuildPlugin => ({
  name: `rsbuild-plugin-llms-${index}`,
  async setup(api) {
    const {
      llmsTxt = {
        name: 'llms.txt',
      },
      mdFiles = {
        mdxToMd: true,
      },
      llmsFullTxt = {
        name: 'llms-full.txt',
      },
      include,
      exclude,
    } = rspressPluginOptions;

    api.onBeforeBuild(async () => {
      const disableSSG = disableSSGRef.current;

      const newPageDataList = mergeRouteMetaWithPageData(
        routes,
        pageDataList,
        langRef.current,
        include,
        exclude,
      );

      // currently we do not support multi version
      const navList: (NavItemWithLink & { lang: string })[] = Array.isArray(nav)
        ? (
            nav
              .map(i => {
                const nav = (i.nav as any).default as NavItemWithLink[];
                const lang = i.lang;
                return nav.map(i => {
                  return {
                    ...i,
                    lang,
                  };
                });
              })
              .flat() as unknown as (NavItemWithLink & { lang: string })[]
          ).filter(i => i.activeMatch || i.link)
        : [];

      const others: PageIndexInfo[] = [];

      const pageArray: PageIndexInfo[][] = new Array(navList.length)
        .fill(0)
        .map(() => []);

      newPageDataList.forEach(pageData => {
        const { routePath, lang } = pageData;

        for (let i = 0; i < pageArray.length; i++) {
          const pageArrayItem = pageArray[i];
          const navItem = navList[i];
          if (
            lang === navItem.lang &&
            new RegExp(navItem.activeMatch ?? navItem.link).test(routePath)
          ) {
            pageArrayItem.push(pageData);
            return;
          }
        }
        others.push(pageData);
      });

      for (const array of pageArray) {
        organizeBySidebar(sidebar, array);
      }

      if (llmsTxt) {
        const { name } = llmsTxt;
        const llmsTxtContent = generateLlmsTxt(
          pageArray,
          navList,
          others,
          llmsTxt,
          titleRef.current,
          descriptionRef.current,
          baseRef.current,
        );
        api.processAssets(
          {
            environments: disableSSG ? ['web'] : ['node'],
            stage: 'additional',
          },
          async ({ compilation, sources }) => {
            const source = new sources.RawSource(llmsTxtContent);
            compilation.emitAsset(name, source);
          },
        );
      }

      const mdContents: Record<string, string> = {};
      await Promise.all(
        [...newPageDataList.values()].map(async pageData => {
          const content = pageData._flattenContent ?? pageData.content;
          const filepath = pageData._filepath;
          const isMD = path.extname(filepath).slice(1) !== 'mdx';
          let mdContent: string | Buffer;
          if (isMD || (mdFiles && mdFiles.mdxToMd === false)) {
            mdContent = content;
          } else {
            try {
              mdContent = (
                await mdxToMd(
                  content,
                  filepath,
                  routeServiceRef.current!,
                  baseRef.current,
                )
              ).toString();
            } catch (e) {
              // flatten might have some edge cases, fallback to no flatten and plain mdx
              logger.debug(e);
              mdContent = content;
              return;
            }
          }
          // @ts-ignore
          pageData.mdContent = mdContent;
          const outFilePath = `${
            pageData.routePath.endsWith('/')
              ? `${pageData.routePath}index`
              : pageData.routePath
          }.md`;
          mdContents[outFilePath] = mdContent.toString();
        }) ?? [],
      );

      if (mdFiles) {
        api.processAssets(
          {
            environments: disableSSG ? ['web'] : ['node'],
            stage: 'additional',
          },
          async ({ compilation, sources }) => {
            if (mdFiles) {
              Object.entries(mdContents).forEach(([outFilePath, content]) => {
                const source = new sources.RawSource(content);
                compilation.emitAsset(`.${outFilePath}`, source);
              });
            }
          },
        );
      }

      if (llmsFullTxt) {
        const { name } = llmsFullTxt;
        const llmsFullTxtContent = generateLlmsFullTxt(
          pageArray,
          navList,
          others,
          baseRef.current,
        );
        api.processAssets(
          { targets: disableSSG ? ['web'] : ['node'], stage: 'additional' },
          async ({ compilation, sources }) => {
            const source = new sources.RawSource(llmsFullTxtContent);
            compilation.emitAsset(name, source);
          },
        );
      }
    });
  },
});

function mergeRouteMetaWithPageData(
  routeMetaList: RouteMeta[],
  pageDataList: PageIndexInfo[],
  lang: string | undefined,
  include: Options['include'],
  exclude: Options['exclude'],
): Map<string, PageIndexInfo> {
  const m = new Map<string, PageIndexInfo>(
    pageDataList
      .filter(pageData => {
        if (include) {
          return include({ page: pageData });
        }
        if (lang) {
          return pageData.lang === lang;
        }
        return true;
      })
      .filter(pageData => {
        if (exclude) {
          return !exclude({ page: pageData });
        }
        return true;
      })
      .map(pageData => [pageData.routePath, pageData]),
  );
  const mergedPageDataList = new Map<string, PageIndexInfo>();

  routeMetaList.forEach(routeMeta => {
    const pageData = m.get(routeMeta.routePath);
    if (pageData) {
      mergedPageDataList.set(routeMeta.routePath, pageData);
    }
  });
  return mergedPageDataList;
}

function flatSidebar(
  sidebar: (
    | SidebarGroup
    | SidebarItem
    | SidebarDivider
    | SidebarSectionHeader
    | string
  )[],
): string[] {
  if (!sidebar) {
    return [];
  }
  return sidebar
    .flatMap(i => {
      if (typeof i === 'string') {
        return i;
      }
      if ('link' in i && typeof i.link === 'string') {
        return [i.link, ...flatSidebar((i as any)?.items ?? [])];
      }
      if ('items' in i && Array.isArray(i.items)) {
        return flatSidebar(i.items);
      }
      return undefined;
    })
    .filter(Boolean) as string[];
}

function organizeBySidebar(sidebar: Sidebar, pages: PageIndexInfo[]) {
  if (pages.length === 0) {
    return;
  }
  const pageItem = pages[0];
  const currSidebar = getSidebarDataGroup(sidebar as any, pageItem.routePath);

  if (currSidebar.length === 0) {
    return;
  }
  const orderList = flatSidebar(currSidebar);

  pages.sort((a, b) => {
    const aIndex = orderList.findIndex(order => matchPath(order, a.routePath));
    const bIndex = orderList.findIndex(order => matchPath(order, b.routePath));
    return aIndex - bIndex;
  });
}

/**
 * A plugin for rspress to generate llms.txt, llms-full.txt, md files to let llm understand your website.
 */
export function pluginLlms(
  options: RspressPluginLlmsOptions = {},
): RspressPlugin {
  const baseRef: { current: string } = { current: '' };
  const docDirectoryRef: { current: string } = { current: '' };
  const titleRef: { current: string | undefined } = { current: '' };
  const descriptionRef: { current: string | undefined } = { current: '' };
  const langRef: { current: string | undefined } = { current: '' };
  const pageDataList: PageIndexInfo[] = [];
  const routes: RouteMeta[] = [];
  const sidebar: Sidebar = {};
  const disableSSGRef: { current: boolean } = { current: false };
  const nav: {
    nav: Nav;
    lang: string;
  }[] = [];
  const routeServiceRef: { current: RouteService | undefined } = {
    current: undefined,
  };

  return {
    name: '@rspress/plugin-llms',
    extendPageData(pageData, isProd) {
      if (isProd) {
        pageDataList.push(pageData);
      }
    },
    routeServiceGenerated(routeService, isProd) {
      if (isProd) {
        routeServiceRef.current = routeService;
      }
    },
    routeGenerated(_routes, isProd) {
      if (isProd) {
        routes.push(..._routes);
      }
    },
    beforeBuild(config) {
      disableSSGRef.current = config.ssg === false;

      const locales = config.themeConfig?.locales;
      const isMultiLang = locales && locales.length > 0;
      const sidebars = isMultiLang
        ? locales.map(i => i.sidebar)
        : [config.themeConfig?.sidebar];

      const configSidebar = sidebars.reduce((prev: Sidebar, curr) => {
        Object.assign(prev, curr);
        return prev;
      }, {} as Sidebar);
      Object.assign(sidebar, configSidebar);

      const configNav = (
        isMultiLang
          ? locales
              .filter(i => Boolean(i.nav))
              .map(i => ({ nav: i.nav, lang: i.lang }))
          : [{ nav: config.themeConfig?.nav, lang: config.lang ?? '' }]
      ) as {
        nav: Nav;
        lang: string;
      }[];
      nav.push(...configNav);

      titleRef.current = config.title;
      descriptionRef.current = config.description;
      langRef.current = config.lang ?? '';
      baseRef.current = config.base ?? '/';
      docDirectoryRef.current = config.root ?? 'docs';
    },
    builderConfig: {
      plugins: [
        ...[
          Array.isArray(options)
            ? options.map((item, index) => {
                return rsbuildPluginLlms({
                  pageDataList,
                  routes,
                  titleRef,
                  descriptionRef,
                  langRef,
                  sidebar,
                  routeServiceRef,
                  nav,
                  baseRef,
                  disableSSGRef,
                  rspressPluginOptions: item,
                  index,
                });
              })
            : rsbuildPluginLlms({
                pageDataList,
                routes,
                titleRef,
                descriptionRef,
                langRef,
                sidebar,
                routeServiceRef,
                nav,
                baseRef,
                disableSSGRef,
                rspressPluginOptions: options,
              }),
        ],
      ],
    },
  };
}
