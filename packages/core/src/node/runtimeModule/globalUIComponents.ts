import { FactoryContext, RuntimeModuleID } from '.';

export async function globalUIComponentsVMPlugin(context: FactoryContext) {
  const { config, pluginDriver } = context;
  let index = 0;

  const globalUIComponentsByPlugins = pluginDriver.globalUIComponents();
  const moduleContent = [
    ...(config?.globalUIComponents || []),
    ...globalUIComponentsByPlugins,
  ]
    .map(source => `import Comp_${index++} from ${JSON.stringify(source)};`)
    .concat(
      `export default [${Array.from(
        { length: index },
        (_, i) => `Comp_${i}`,
      ).join(', ')}];`,
    )
    .join('');

  return {
    [RuntimeModuleID.GlobalComponents]: moduleContent,
  };
}
