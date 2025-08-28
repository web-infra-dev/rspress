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
    filepaths: string[];
  } = {
    pageData: null,
    searchIndex: null,
    indexHashByGroup: null,
    filepaths: [],
  };
  const searchIndexRsbuildPlugin: RsbuildPlugin = {
    name: 'rsbuild-plugin-searchIndex',
    async setup(api) {
      api.modifyBundlerChain(async bundlerChain => {
        const alias = bundlerChain.resolve.alias.entries();
        const { pageData, indexHashByGroup, searchIndex, filepaths } =
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
        ref.filepaths = filepaths;

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
        [RuntimeModuleID.PageData]: async ({ addDependency }) => {
          // TODO: support hmr
          // This place needs to obtain the specific file that has been modified and update the file information.
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
