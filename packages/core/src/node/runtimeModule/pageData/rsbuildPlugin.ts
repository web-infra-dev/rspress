import type { RsbuildPlugin } from '@rsbuild/core';
import { isProduction } from '@rspress/shared';
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
  let pageDataAlias: Record<string, string> | undefined;
  let refreshPromise: Promise<void> | undefined;

  const refreshPageData = async (releaseInDevelopment = false) => {
    const alias = pageDataAlias;
    if (!alias) {
      return;
    }
    refreshPromise ??= (async () => {
      const now = performance.now();
      pageDataResult = await createPageData({
        config,
        alias,
        userDocRoot,
        routeService,
        pluginDriver,
      });
      logger.debug(`createPageData cost: ${performance.now() - now}ms`);
    })();
    const currentPromise = refreshPromise;
    try {
      await currentPromise;
    } catch (error) {
      if (refreshPromise === currentPromise) {
        refreshPromise = undefined;
      }
      throw error;
    }
    if (
      releaseInDevelopment &&
      !isProduction() &&
      refreshPromise === currentPromise
    ) {
      refreshPromise = undefined;
    }
  };

  const searchIndexRsbuildPlugin: RsbuildPlugin = {
    name: 'rsbuild-plugin-searchIndex',
    async setup(api) {
      api.modifyBundlerChain(async (bundlerChain, { environment }) => {
        const alias = bundlerChain.resolve.alias.entries();
        pageDataAlias ??= alias as Record<string, string>;
        if (environment.name === 'web') {
          pageDataAlias = alias as Record<string, string>;
          await refreshPageData();
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
          await refreshPageData(true);
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
