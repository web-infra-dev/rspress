import { type FactoryContext, RuntimeModuleID } from '.';

export async function globalStylesVMPlugin(context: FactoryContext) {
  const { config, pluginDriver } = context;
  const globalStylesByPlugins = pluginDriver.globalStyles();

  const moduleContent = (
    await Promise.all(
      [config?.globalStyles || '', ...globalStylesByPlugins]
        .filter(source => source.length > 0)
        .map(async source => {
          return `import ${JSON.stringify(source)};`;
        }),
    )
  ).join('');

  return {
    [RuntimeModuleID.GlobalStyles]: moduleContent,
  };
}
