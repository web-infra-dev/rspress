import { RuntimeModuleID, type VirtualModulePlugin } from './types';

export const globalStylesVMPlugin: VirtualModulePlugin = context => {
  return {
    [RuntimeModuleID.GlobalStyles]: () => {
      const { config, pluginDriver } = context;
      const globalStylesByPlugins = pluginDriver.globalStyles();

      const moduleContent = [config?.globalStyles, ...globalStylesByPlugins]
        .filter(Boolean)
        .map(source => `import ${JSON.stringify(source)};`)
        .join('');
      return moduleContent;
    },
  };
};
