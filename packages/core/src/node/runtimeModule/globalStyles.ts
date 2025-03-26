import { type FactoryContext, RuntimeModuleID } from '.';

export async function globalStylesVMPlugin(context: FactoryContext) {
  const { config, pluginDriver } = context;
  const globalStylesByPlugins = pluginDriver.globalStyles();

  const moduleContent = [config?.globalStyles, ...globalStylesByPlugins]
    .filter(Boolean)
    .map(source => `import ${JSON.stringify(source)};`)
    .join('');

  return {
    [RuntimeModuleID.GlobalStyles]: moduleContent,
  };
}
