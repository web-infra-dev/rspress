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
  type PageDataResult = Awaited<ReturnType<typeof createPageData>>;
  type RefreshMode = 'compiler' | 'virtual-module';
  const pageDataState: {
    alias?: Record<string, string>;
    generation?: { revision: number; promise: Promise<PageDataResult> };
    result?: PageDataResult;
    revision: number;
  } = { revision: 0 };

  const setPageDataAlias = (
    alias: Record<string, string>,
    source: 'fallback' | 'web',
  ) => {
    if (
      (pageDataState.alias && source === 'fallback') ||
      pageDataState.alias === alias
    ) {
      return;
    }
    pageDataState.alias = alias;
    pageDataState.generation = undefined;
    pageDataState.revision += 1;
  };

  const refreshPageData = async (mode: RefreshMode) => {
    const alias = pageDataState.alias;
    if (!alias) {
      return;
    }
    const revision = pageDataState.revision;
    if (pageDataState.generation?.revision !== revision) {
      const now = performance.now();
      pageDataState.generation = {
        revision,
        promise: createPageData({
          config,
          alias,
          userDocRoot,
          routeService,
          pluginDriver,
        }).then(result => {
          logger.debug(`createPageData cost: ${performance.now() - now}ms`);
          return result;
        }),
      };
    }
    const generation = pageDataState.generation;
    try {
      const result = await generation.promise;
      if (pageDataState.revision === revision) {
        pageDataState.result = result;
      }
    } catch (error) {
      if (pageDataState.generation === generation) {
        pageDataState.generation = undefined;
      }
      throw error;
    } finally {
      if (
        mode === 'virtual-module' &&
        !isProduction() &&
        pageDataState.generation === generation
      ) {
        pageDataState.generation = undefined;
      }
    }
  };

  const searchIndexRsbuildPlugin: RsbuildPlugin = {
    name: 'rsbuild-plugin-searchIndex',
    async setup(api) {
      api.modifyBundlerChain(async (bundlerChain, { environment }) => {
        const alias = bundlerChain.resolve.alias.entries() as Record<
          string,
          string
        >;
        setPageDataAlias(
          alias,
          environment.name === 'web' ? 'web' : 'fallback',
        );
        if (environment.name === 'web') {
          await refreshPageData('compiler');
        }

        api.processAssets(
          { stage: 'report', environments: ['web'] },
          ({ compilation, compiler }) => {
            if (!pageDataState.result) {
              return;
            }
            for (const [filename, stringifiedIndex] of Object.entries(
              pageDataState.result.searchIndex,
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
          await refreshPageData('virtual-module');
          for (const file of pageDataState.result?.filepaths ?? []) {
            addDependency(file);
          }

          return `export const pageData = ${JSON.stringify(pageDataState.result?.pageData ?? null, null, 2)};
          export const searchIndexHash = ${JSON.stringify(pageDataState.result?.indexHashByGroup ?? null, null, 2)};`;
        },
      },
    }),
  ];
};
