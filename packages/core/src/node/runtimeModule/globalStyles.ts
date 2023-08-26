import { join } from 'path';
import fs from '@modern-js/utils/fs-extra';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { FactoryContext, RuntimeModuleID } from '.';

export async function globalStylesVMPlugin(context: FactoryContext) {
  const { runtimeTempDir, config, pluginDriver } = context;
  const modulePath = join(runtimeTempDir, `${RuntimeModuleID.GlobalStyles}.js`);
  const globalStylesByPlugins = pluginDriver.globalStyles();
  // Patch --modern-xxx, .modern-xxx global name
  const moduleContent = (
    await Promise.all(
      [config?.globalStyles || '', ...globalStylesByPlugins]
        .filter(source => source.length > 0)
        .map(async source => {
          const styleContent = await fs.readFile(source, 'utf-8');

          // Patch --modern-xxx, .modern-xxx global name
          const patchedStyleContent = styleContent
            .replace(/--modern-/g, '--rp-')
            .replace(/\.modern-doc/g, '.rspress')
            .replace(/\.modern-/g, '.rspress-');

          await fs.writeFile(source, patchedStyleContent, 'utf-8');

          console.log(`[globalStylesVMPlugin] patched ${source}`);

          return `import ${JSON.stringify(source)};`;
        }),
    )
  ).join('');

  return new RuntimeModulesPlugin({
    [modulePath]: moduleContent,
  });
}
