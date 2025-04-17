import path from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { RouteService } from '@rspress/core';
import { matchSidebar } from '@rspress/shared';
import type {
  Nav,
  PageIndexInfo,
  RouteMeta,
  RspressPlugin,
  Sidebar,
} from '@rspress/shared';
import type { NavItemWithLink } from '@rspress/shared';
import { generateLlmsFullTxt, generateLlmsTxt } from './llmsTxt';
import { mdxToMd } from './mdxToMd';

interface Options {
  output: {
    llmsTxt?: boolean;
    mdFiles?: boolean;
    llmsFullTxt?: boolean;
  };
}

interface rsbuildPluginLlmsOptions extends Options {
  docDirectoryRef: { current: string };
  baseRef: { current: string };
  pageDataList: PageIndexInfo[];
  routeServiceRef: { current: RouteService | undefined };
  routes: RouteMeta[];
  sidebar: Sidebar;
  nav: Nav[];
  output: Required<Options['output']>;
}

const rsbuildPluginLlms = ({
  pageDataList,
  routes,
  // sidebar,
  baseRef,
  docDirectoryRef,
  routeServiceRef,
  nav,
  output,
}: rsbuildPluginLlmsOptions): RsbuildPlugin => ({
  name: 'rsbuild-plugin-llms',
  async setup(api) {
    const { llmsTxt, mdFiles, llmsFullTxt } = output;

    api.onBeforeBuild(async () => {
      const base = baseRef.current;
      const docDirectory = docDirectoryRef.current;

      const newPageDataList = mergeRouteMetaWithPageData(routes, pageDataList);

      // currently we do not support multi version
      const navList: NavItemWithLink[] = Array.isArray(nav)
        ? (
            nav
              .map(i => (i as any).default)
              .flat() as unknown as NavItemWithLink[]
          )
            .filter(Boolean)
            .filter(i => i.activeMatch || i.link)
        : [];

      const others: PageIndexInfo[] = [];

      const pageArray: PageIndexInfo[][] = new Array(navList.length)
        .fill(0)
        .map(() => []);

      newPageDataList.forEach(pageData => {
        const { routePath } = pageData;

        for (let i = 0; i < pageArray.length; i++) {
          const pageArrayItem = pageArray[i];
          const navItem = navList[i];

          if (
            matchSidebar(navItem.activeMatch ?? navItem.link, routePath, base)
          ) {
            pageArrayItem.push(pageData);
            return;
          }
          others.push(pageData);
        }
      });

      if (llmsTxt) {
        const llmsTxtContent = generateLlmsTxt(pageArray, navList, others);
        api.processAssets(
          { targets: ['node'], stage: 'additional' },
          async ({ compilation, sources }) => {
            const source = new sources.RawSource(llmsTxtContent);
            compilation.emitAsset('llms.txt', source);
          },
        );
      }

      const mdContents: Record<string, string> = {};
      await Promise.all(
        [...newPageDataList.values()].map(async pageData => {
          const content = pageData.flattenContent ?? pageData.content;
          const filepath = pageData._filepath;
          const isMD = path.extname(filepath).slice(1) === 'md';
          let mdContent: string | Buffer;
          if (isMD) {
            mdContent = content;
          } else {
            try {
              mdContent = (
                await mdxToMd(
                  content,
                  filepath,
                  docDirectory,
                  routeServiceRef.current,
                )
              ).toString();
            } catch (e) {
              console.error(e);
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
          { targets: ['node'], stage: 'additional' },
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
        const llmsFullTxtContent = generateLlmsFullTxt(
          pageArray,
          navList,
          others,
        );
        api.processAssets(
          { targets: ['node'], stage: 'additional' },
          async ({ compilation, sources }) => {
            const source = new sources.RawSource(llmsFullTxtContent);
            compilation.emitAsset('llms.full.txt', source);
          },
        );
      }
    });
  },
});

function mergeRouteMetaWithPageData(
  routeMetaList: RouteMeta[],
  pageDataList: PageIndexInfo[],
): Map<string, PageIndexInfo> {
  const m = new Map<string, PageIndexInfo>(
    pageDataList.map(pageData => [pageData.routePath, pageData]),
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

/**
 * A plugin for rspress to generate llms.txt, llms-full.txt, md files to let llm understand your website.
 */
export function pluginLlms(options: Options = { output: {} }): RspressPlugin {
  const { llmsTxt = true, llmsFullTxt = true, mdFiles = true } = options.output;

  const baseRef: { current: string } = { current: '' };
  const docDirectoryRef: { current: string } = { current: '' };
  const pageDataList: PageIndexInfo[] = [];
  const routes: RouteMeta[] = [];
  const sidebar: Sidebar = {};
  const nav: Nav[] = [];
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
      Object.assign(sidebar, config.themeConfig?.sidebar ?? {});
      const configNav = config.themeConfig?.locales
        ?.map(i => {
          return i.nav;
        })
        .filter(Boolean) as Nav[];
      nav.push(...configNav);

      baseRef.current = config.base ?? '/';
      docDirectoryRef.current = config.root ?? 'docs';
    },
    builderConfig: {
      plugins: [
        rsbuildPluginLlms({
          ...options,
          pageDataList,
          routes,
          sidebar,
          docDirectoryRef,
          routeServiceRef,
          nav,
          baseRef,
          output: {
            llmsFullTxt,
            llmsTxt,
            mdFiles,
          },
        }),
      ],
    },
  };
}
