import type { RsbuildPlugin } from '@rsbuild/core';
import type { SiteData } from '@rspress/shared';
import { pluginVirtualModule } from 'rsbuild-plugin-virtual-module';
import { type FactoryContext, RuntimeModuleID } from '../types';
import { createSiteData } from './createSiteData';

export const rsbuildPluginDocVM = async ({
  config,
  userDocRoot,
  routeService,
  pluginDriver,
}: Omit<FactoryContext, 'alias'>): Promise<RsbuildPlugin[]> => {
  const ref: {
    siteData: Omit<SiteData, 'root'> | null;
    searchIndex: Record<string, string> | null;
    indexHashByGroup: Record<string, string> | null;
  } = { siteData: null, searchIndex: null, indexHashByGroup: null };
  const foo: RsbuildPlugin = {
    name: 'rsbuild-plugin-searchIndex',
    async setup(api) {
      api.modifyBundlerChain(async bundlerChain => {
        const alias = bundlerChain.resolve.alias.entries();
        const { siteData, searchIndex, indexHashByGroup } =
          await createSiteData({
            config,
            alias: alias as Record<string, string>,
            userDocRoot,
            routeService,
            pluginDriver,
          });
        ref.siteData = siteData;
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
    foo,
    pluginVirtualModule({
      tempDir: '.rspress',
      virtualModules: {
        [RuntimeModuleID.SiteData]: () =>
          `export default ${JSON.stringify(ref.siteData, null, 2)}`,
        [RuntimeModuleID.SearchIndexHash]: () =>
          `export default ${JSON.stringify(ref.indexHashByGroup, null, 2)}`,
      },
    }),
  ];
};
