import path from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import type {
  Nav,
  NavItem,
  NavItemWithLink,
  PageIndexInfo,
  RouteMeta,
  RouteService,
  RspressPlugin,
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarSectionHeader,
} from '@rspress/core';
import { getSidebarDataGroup, logger, matchPath } from '@rspress/core';
import {
  generateLlmsFullTxt,
  generateLlmsTxt,
  routePathToMdPath,
} from './llmsTxt';
import { normalizeMdFile } from './normalizeMdFile';
import type {
  Options,
  RspressPluginLlmsOptions,
  rsbuildPluginLlmsOptions,
} from './types';

function resolveNavForVersion(
  nav: { nav: Nav; lang: string }[],
  version: string,
  defaultVersion: string,
): (NavItemWithLink & { lang: string })[] {
  return nav
    .flatMap(({ nav, lang }) => {
      let navArray: NavItem[];
      if (Array.isArray(nav)) {
        navArray = nav;
      } else {
        // nav is { [version]: NavItem[] }
        navArray =
          (nav as Record<string, NavItem[]>)[version] ??
          (nav as Record<string, NavItem[]>)[defaultVersion] ??
          [];
      }
      return navArray.map(
        item => ({ ...item, lang }) as NavItemWithLink & { lang: string },
      );
    })
    .filter(i => i.activeMatch || i.link);
}

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
  versionsRef,
  defaultVersionRef,
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
        mdxToMd: false,
        remarkPlugins: [],
      },
      llmsFullTxt = {
        name: 'llms-full.txt',
      },
      include,
      exclude,
    } = rspressPluginOptions;

    api.onBeforeBuild(async () => {
      const disableSSG = disableSSGRef.current;
      const versions = versionsRef.current;
      const defaultVersion = defaultVersionRef.current;
      const isMultiVersion = versions.length > 0;

      const newPageDataList = mergeRouteMetaWithPageData(
        routes,
        pageDataList,
        langRef.current,
        include,
        exclude,
      );

      const versionList = isMultiVersion ? versions : [''];

      for (const version of versionList) {
        const navList = resolveNavForVersion(nav, version, defaultVersion);

        // Filter pages for this version
        const versionPages = isMultiVersion
          ? new Map(
              [...newPageDataList.entries()].filter(
                ([, pageData]) => pageData.version === version,
              ),
            )
          : newPageDataList;

        const others: PageIndexInfo[] = [];
        const pageArray: PageIndexInfo[][] = new Array(navList.length)
          .fill(0)
          .map(() => []);

        versionPages.forEach(pageData => {
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

        const versionPrefix =
          isMultiVersion && version !== defaultVersion ? `${version}/` : '';

        if (llmsTxt) {
          const name = `${versionPrefix}${llmsTxt.name}`;
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

        if (llmsFullTxt) {
          const name = `${versionPrefix}${llmsFullTxt.name}`;
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
      }

      // md files are not version-scoped (they map 1:1 with routes which already have version in path)
      const mdContents: Record<string, string> = {};
      await Promise.all(
        [...newPageDataList.values()].map(async pageData => {
          const content = pageData._flattenContent ?? pageData.content;
          const filepath = pageData._filepath;
          const isMD = path.extname(filepath).slice(1) !== 'mdx';
          let mdContent: string | Buffer;
          try {
            mdContent = await normalizeMdFile(
              content,
              filepath,
              routeServiceRef.current!,
              baseRef.current,
              typeof mdFiles !== 'boolean'
                ? (mdFiles?.mdxToMd ?? false)
                : false,
              isMD,
              typeof mdFiles !== 'boolean'
                ? (mdFiles?.remarkPlugins ?? [])
                : [],
            );
          } catch (e) {
            logger.debug('normalizeMdFile failed', pageData.routePath, e);
            mdContent = content;
          }
          const outFilePath = routePathToMdPath(pageData.routePath, '');
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
    let aIndex = orderList.findIndex(order => matchPath(order, a.routePath));
    // if not in sidebar, put it to last
    if (aIndex === -1) {
      aIndex = Number.MAX_SAFE_INTEGER;
    }
    let bIndex = orderList.findIndex(order => matchPath(order, b.routePath));
    if (bIndex === -1) {
      bIndex = Number.MAX_SAFE_INTEGER;
    }
    return aIndex - bIndex;
  });
}

function getDefaultOptions(
  lang: string | undefined,
  langs: string[],
): RspressPluginLlmsOptions {
  if (!lang || langs.length === 0) {
    return {};
  }
  return langs.map(l => {
    if (l === lang) {
      return {
        llmsTxt: {
          name: 'llms.txt',
        },
        llmsFullTxt: {
          name: 'llms-full.txt',
        },
      };
    }
    return {
      llmsTxt: {
        name: `${l}/llms.txt`,
      },
      llmsFullTxt: {
        name: `${l}/llms-full.txt`,
      },
      include({ page }: { page: PageIndexInfo }) {
        return page.lang === l;
      },
    };
  });
}

/**
 * A plugin for rspress to generate llms.txt, llms-full.txt, md files to let llm understand your website.
 */
export function pluginLlms(options?: RspressPluginLlmsOptions): RspressPlugin {
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
  const versionsRef: { current: string[] } = { current: [] };
  const defaultVersionRef: { current: string } = { current: '' };

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
    config(config) {
      config.themeConfig = config.themeConfig || {};
      config.themeConfig.locales =
        config.themeConfig.locales || config.locales || [];

      const langs = config.themeConfig.locales.map(locale => locale.lang);
      let mergedOptions: RspressPluginLlmsOptions;
      if (options === undefined) {
        mergedOptions = getDefaultOptions(config.lang, langs);
      } else {
        mergedOptions = options;
      }

      if (!config.builderConfig) {
        config.builderConfig = {};
      }
      if (!config.builderConfig.plugins) {
        config.builderConfig.plugins = [];
      }

      config.builderConfig.plugins.push(
        ...(Array.isArray(mergedOptions)
          ? mergedOptions.map((item, index) => {
              return rsbuildPluginLlms({
                pageDataList,
                routes,
                titleRef,
                descriptionRef,
                langRef,
                sidebar,
                routeServiceRef,
                nav,
                versionsRef,
                defaultVersionRef,
                baseRef,
                disableSSGRef,
                rspressPluginOptions: item,
                index,
              });
            })
          : [
              rsbuildPluginLlms({
                pageDataList,
                routes,
                titleRef,
                descriptionRef,
                langRef,
                sidebar,
                routeServiceRef,
                nav,
                versionsRef,
                defaultVersionRef,
                baseRef,
                disableSSGRef,
                rspressPluginOptions: mergedOptions,
              }),
            ]),
      );
      return config;
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

      if (config.multiVersion) {
        versionsRef.current = config.multiVersion.versions || [];
        defaultVersionRef.current = config.multiVersion.default || '';
      }
    },
  };
}
