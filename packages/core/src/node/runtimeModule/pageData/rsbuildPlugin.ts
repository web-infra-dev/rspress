import type { RsbuildPlugin } from '@rsbuild/core';
import type { PageData } from '@rspress/shared';
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
  const ref: {
    pageData: PageData | null;
    searchIndex: Record<string, string> | null;
    indexHashByGroup: Record<string, string> | null;
    filepaths: string[];
  } = {
    pageData: null,
    searchIndex: null,
    indexHashByGroup: null,
    filepaths: [],
  };
  let webAlias: Record<string, string> | undefined;
  let refreshPromise: Promise<void> | undefined;

  const refreshPageData = async () => {
    if (!webAlias) {
      return;
    }
    refreshPromise ??= (async () => {
      const now = performance.now();
      const { pageData, indexHashByGroup, searchIndex, filepaths } =
        await createPageData({
          config,
          alias: webAlias,
          userDocRoot,
          routeService,
          pluginDriver,
        });
      logger.debug(`createPageData cost: ${performance.now() - now}ms`);

      ref.pageData = pageData;
      ref.searchIndex = searchIndex;
      ref.indexHashByGroup = indexHashByGroup;
      ref.filepaths = filepaths;
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
            if (!ref.searchIndex) {
              return;
            }
            for (const [filename, stringifiedIndex] of Object.entries(
              ref.searchIndex,
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
          for (const file of ref.filepaths) {
            addDependency(file);
          }

          return `export const pageData = ${JSON.stringify(ref.pageData, null, 2)};
          export const searchIndexHash = ${JSON.stringify(ref.indexHashByGroup, null, 2)};`;
        },
      },
    }),
  ];
};
