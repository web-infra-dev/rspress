import fs from '@rspress/shared/fs-extra';
import { type FactoryContext, RuntimeModuleID } from '.';

export async function globalStylesVMPlugin(context: FactoryContext) {
  const { config, pluginDriver } = context;
  const globalStylesByPlugins = pluginDriver.globalStyles();

  if (config.globalStyles) {
    // Only patch user config global styles
    const source = config.globalStyles;
    const styleContent = await fs.readFile(source, 'utf-8');

    // Patch --modern-abc, .modern-abc global name
    const patchedStyleContent = styleContent
      .replace(/--modern-/g, '--rp-')
      .replace(/\.modern-doc/g, '.rspress')
      .replace(/\.modern-/g, '.rspress-');

    await fs.writeFile(source, patchedStyleContent, 'utf-8');
  }

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
