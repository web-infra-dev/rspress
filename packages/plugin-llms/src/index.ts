import path from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import { matchSidebar } from '@rspress/runtime';
import type {
  Nav,
  PageIndexInfo,
  RouteMeta,
  RspressPlugin,
  Sidebar,
} from '@rspress/shared';
import type { NavItemWithLink } from '@rspress/shared';
import { mdxToMd } from './mdxToMd';

interface Options {
  output: {
    llmsTxt?: boolean;
    mdFiles?: boolean;
    llmsFullTxt?: boolean;
  };
}

interface rsbuildPluginLlmsOptions extends Options {
  pageDataList: PageIndexInfo[];
  routes: RouteMeta[];
  sidebar: Sidebar;
  nav: Nav;
}

const rsbuildPluginLlms = ({
  pageDataList,
  routes,
  sidebar,
  nav,
  output,
}: rsbuildPluginLlmsOptions): RsbuildPlugin => ({
  name: 'rsbuild-plugin-llms',
  async setup(api) {
    const { llmsTxt, mdFiles, llmsFullTxt } = output;

    const docDirectory = api.context.rootPath;

    const mdContents: Record<string, string> = {};

    const newPageDataList = mergeRouteMetaWithPageData(routes, pageDataList);

    // currently we do not support multi version
    const navList: [string, NavItemWithLink][] = Array.isArray(nav)
      ? ((nav as NavItemWithLink[])
          .map(nav => {
            if (nav.activeMatch) {
              return [nav.activeMatch, nav];
            }
            return undefined;
          })
          .filter(Boolean) as [string, NavItemWithLink][])
      : [];

    const activeMatches: string[] = navList.map(([activeMatch]) => activeMatch);
    const obj: Record<string, PageIndexInfo[]> = Object.fromEntries(
      activeMatches.map(activeMatch => [activeMatch, []]),
    );
    obj.others = [];

    newPageDataList.forEach(pageData => {
      const { routePath } = pageData;
      const activeMatch = activeMatches.find(key =>
        matchSidebar(key, routePath),
      );
      if (activeMatch) {
        obj[activeMatch].push(pageData);
      } else {
        obj.others.push(pageData);
      }
    });

    await Promise.all(
      newPageDataList.values().map(async pageData => {
        const content = pageData.flattenContent ?? pageData.content;
        const filepath = pageData._filepath;
        const isMD = path.extname(filepath).slice(1) === 'md';
        let mdContent: string | Buffer;
        if (isMD) {
          mdContent = content;
        } else {
          mdContent = (
            await mdxToMd(content, filepath, docDirectory)
          ).toString();
        }
        const outFilePath = `${
          pageData.routePath.endsWith('/')
            ? `${pageData.routePath}index`
            : pageData.routePath
        }.md`;
        mdContents[outFilePath] = mdContent.toString();
      }) ?? [],
    );

    api.processAssets(
      { targets: ['web'], stage: 'additional' },
      async ({ compilation, sources }) => {
        if (mdFiles) {
          Object.entries(mdContents).forEach(([outFilePath, content]) => {
            const source = new sources.RawSource(content);
            console.log(`.${outFilePath}`);
            compilation.emitAsset(`.${outFilePath}`, source);
          });
        }
      },
    );
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
  // const { llmsTxt, llmsFullTxt, mdFiles } = options.output;
  const pageDataList: PageIndexInfo[] = [];
  const routes: RouteMeta[] = [];
  const sidebar: Sidebar = {};
  const nav: Nav = {};

  return {
    name: '@rspress/plugin-llms',
    extendPageData(pageData, isProd) {
      if (isProd) {
        pageDataList.push(pageData);
      }
    },
    routeGenerated(_routes, isProd) {
      if (isProd) {
        routes.push(..._routes);
      }
    },
    beforeBuild(config) {
      Object.assign(sidebar, config.themeConfig?.sidebar ?? {});
      Object.assign(nav, config.themeConfig?.nav ?? {});
    },
    builderConfig: {
      plugins: [
        rsbuildPluginLlms({
          pageDataList,
          routes,
          sidebar,
          nav,
          ...options,
        }),
      ],
    },
  };
}
