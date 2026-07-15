import type { RsbuildPlugin } from '@rsbuild/core';
import { logger } from '@rspress/shared/logger';
import { pluginVirtualModule } from 'rsbuild-plugin-virtual-module';
import { type FactoryContext, RuntimeModuleID } from '../types';
import { createPageData } from './createPageData';

export const rsbuildPluginDocVM = async ({
  config,
  userDocRoot,
  routeService,
  pluginDriver,
}: Omit<FactoryContext, 'alias'>): Promise<RsbuildPlugin[]> => {
  let pageDataResult: Awaited<ReturnType<typeof createPageData>> | undefined;
  let webAlias: Record<string, string> | undefined;
  let refreshPromise: Promise<void> | undefined;

  const refreshPageData = async () => {
    if (!webAlias) {
      return;
    }
    refreshPromise ??= (async () => {
      const now = performance.now();
      pageDataResult = await createPageData({
        config,
        alias: webAlias,
        userDocRoot,
        routeService,
        pluginDriver,
      });
      logger.debug(`createPageData cost: ${performance.now() - now}ms`);
    })();
    try {
      await refreshPromise;
    } finally {
      refreshPromise = undefined;
    }
  };

  const searchIndexRsbuildPlugin: RsbuildPlugin = {
    name: 'rsbuild-plugin-searchIndex',
    async setup(api) {
      api.modifyBundlerChain((bundlerChain, { environment }) => {
        const alias = bundlerChain.resolve.alias.entries();
        if (environment.name === 'web') {
          webAlias = alias as Record<string, string>;
        }

        api.processAssets(
          { stage: 'report', environments: ['web'] },
          ({ compilation, compiler }) => {
            if (!pageDataResult) {
              return;
            }
            for (const [filename, stringifiedIndex] of Object.entries(
              pageDataResult.searchIndex,
            )) {
              compilation.emitAsset(
                `static/${filename}`,
                new compiler.webpack.sources.RawSource(stringifiedIndex),
              );
            }
          },
        );
      });
    },
  };

  return [
    searchIndexRsbuildPlugin,
    pluginVirtualModule({
      tempDir: '.rspress',
      virtualModules: {
        [RuntimeModuleID.PageData]: async ({ addDependency }) => {
          await refreshPageData();
          for (const file of pageDataResult?.filepaths ?? []) {
            addDependency(file);
          }

          return `export const pageData = ${JSON.stringify(pageDataResult?.pageData ?? null, null, 2)};
          export const searchIndexHash = ${JSON.stringify(pageDataResult?.indexHashByGroup ?? null, null, 2)};`;
        },
      },
    }),
  ];
};
