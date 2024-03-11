import { FactoryContext, RuntimeModuleID } from '.';

export async function globalUIComponentsVMPlugin(context: FactoryContext) {
  const { config, pluginDriver } = context;
  let index = 0;

  const globalUIComponentsByPlugins = pluginDriver.globalUIComponents();
  const globalComponents = [
    ...(config?.globalUIComponents || []),
    ...globalUIComponentsByPlugins,
  ];
  const moduleContent = globalComponents
    .map(source => {
      const name = `Comp_${index}`;
      if (Array.isArray(source)) {
        return `import ${name} from ${JSON.stringify(source[0])};
const Props_${index++} = ${JSON.stringify(source[1])};\n`;
      }

      index++;
      return `import ${name} from ${JSON.stringify(source)};\n`;
    })
    .concat(
      `export default [${Array.from({ length: index }, (_, i) => {
        if (Array.isArray(globalComponents[i])) {
          return `[${`Comp_${i}`}, Props_${i}]`;
        }
        return `Comp_${i}`;
      }).join(', ')}];`,
    )
    .join('');

  return {
    [RuntimeModuleID.GlobalComponents]: moduleContent,
  };
}
