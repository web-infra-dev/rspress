import type { RsbuildPlugin } from '@rsbuild/core';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import { routeVMPlugin } from './routeData';
import { siteDataVMPlugin } from './siteData/index';
import type { FactoryContext } from './types';

// FIXME: migrate to rsbuild-plugin-virtual-module
type RuntimeModuleFactory = (
  context: FactoryContext,
) => Record<string, string> | Promise<Record<string, string>>;

export const runtimeModuleFactory: RuntimeModuleFactory[] = [
  /**
   * Generate route data for client and server runtime
   */
  routeVMPlugin,
  /**
   * Generate search index and site data for client runtime
   * Also responsible for automatically importing prism languages
   */
  siteDataVMPlugin,
];

// We will use this plugin to generate runtime module in browser, which is important to ensure the client have access to some compile-time data
export function rsbuildPluginDocVM(
  factoryContext: Omit<FactoryContext, 'alias' | 'isSSR'>,
): RsbuildPlugin {
  const { pluginDriver } = factoryContext;
  return {
    name: 'rsbuild-plugin-doc-vm',
    setup(api) {
      api.modifyBundlerChain(async (bundlerChain, { target }) => {
        const isServer = target === 'node';
        // The order should be sync
        const alias = bundlerChain.resolve.alias.entries();
        const runtimeModule: Record<string, string> = {};
        // Add internal runtime module
        for (const factory of runtimeModuleFactory) {
          const moduleResult = await factory({
            ...factoryContext,
            isSSR: isServer,
            alias: alias as Record<string, string>,
          });
          Object.assign(runtimeModule, moduleResult);
        }
        // Add runtime module from outer plugins
        const modulesByPlugin = await pluginDriver.addRuntimeModules();
        Object.keys(modulesByPlugin).forEach(key => {
          if (runtimeModule[key]) {
            throw new Error(
              `The runtime module ${key} is duplicated, please check your plugin`,
            );
          }
          runtimeModule[key] = modulesByPlugin[key];
        });
        bundlerChain
          .plugin('rspress-runtime-module')
          .use(
            new RspackVirtualModulePlugin(
              runtimeModule,
              factoryContext.runtimeTempDir,
            ),
          );
      });
    },
  };
}
