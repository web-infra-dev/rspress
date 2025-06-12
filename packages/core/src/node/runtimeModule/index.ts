import type { RsbuildPlugin } from '@rsbuild/core';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import type { PluginDriver } from '../PluginDriver';
import { siteDataVMPlugin } from './siteData/index';
import type { FactoryContext } from './types';

// FIXME: migrate to rsbuild-plugin-virtual-module
type RuntimeModuleFactory = (
  context: FactoryContext,
) => Record<string, string> | Promise<Record<string, string>>;

export const runtimeModuleFactory: RuntimeModuleFactory[] = [
  /**
   * Generate search index and site data for client runtime
   */
  siteDataVMPlugin,
];

// We will use this plugin to generate runtime module in browser, which is important to ensure the client have access to some compile-time data
export function rsbuildPluginDocVM(
  factoryContext: Omit<FactoryContext, 'alias' | 'isSSR'>,
): RsbuildPlugin {
  return {
    name: 'rsbuild-plugin-doc-vm',
    setup(api) {
      api.modifyBundlerChain(async bundlerChain => {
        // The order should be sync
        const alias = bundlerChain.resolve.alias.entries();
        const runtimeModule: Record<string, string> = {};
        // Add internal runtime module
        for (const factory of runtimeModuleFactory) {
          const moduleResult = await factory({
            ...factoryContext,
            alias: alias as Record<string, string>,
          });
          Object.assign(runtimeModule, moduleResult);
        }
        bundlerChain
          .plugin('rspress-runtime-module')
          .use(new RspackVirtualModulePlugin(runtimeModule));
      });
    },
  };
}

export async function getVirtualModulesFromPlugins(
  pluginDriver: PluginDriver,
): Promise<Record<string, () => string>> {
  const runtimeModule: Record<string, () => string> = {};
  const modulesByPlugin = await pluginDriver.addRuntimeModules();
  Object.keys(modulesByPlugin).forEach(key => {
    if (runtimeModule[key]) {
      throw new Error(
        `The runtime module ${key} is duplicated, please check your plugin`,
      );
    }
    runtimeModule[key] = () => modulesByPlugin[key];
  });
  return runtimeModule;
}
