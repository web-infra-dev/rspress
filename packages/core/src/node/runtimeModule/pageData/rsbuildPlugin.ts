import type { RsbuildPlugin } from '@rsbuild/core';
import type { PageData } from '@rspress/shared';
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
  } = { pageData: null, searchIndex: null, indexHashByGroup: null };
  const searchIndexRsbuildPlugin: RsbuildPlugin = {
    name: 'rsbuild-plugin-searchIndex',
    async setup(api) {
      api.modifyBundlerChain(async bundlerChain => {
        const alias = bundlerChain.resolve.alias.entries();
        const { pageData, indexHashByGroup, searchIndex } =
          await createPageData({
            config,
            alias: alias as Record<string, string>,
            userDocRoot,
            routeService,
            pluginDriver,
          });

        ref.pageData = pageData;
        ref.searchIndex = searchIndex;
        ref.indexHashByGroup = indexHashByGroup;
        api.processAssets(
          { stage: 'report', environments: ['web'] },
          ({ compilation, compiler }) => {
            for (const [filename, stringifiedIndex] of Object.entries(
              searchIndex,
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
        [RuntimeModuleID.PageData]: () =>
          `export default ${JSON.stringify(ref.pageData, null, 2)}`,
        [RuntimeModuleID.SearchIndexHash]: () =>
          `export default ${JSON.stringify(ref.indexHashByGroup, null, 2)}`,
      },
    }),
  ];
};
