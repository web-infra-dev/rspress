import { join } from 'path';
import fs from '@modern-js/utils/fs-extra';
import RuntimeModulesPlugin from './RuntimeModulePlugin';
import { FactoryContext, RuntimeModuleID } from '.';

export async function searchHookVMPlugin(context: FactoryContext) {
  const { config } = context;
  let content = 'export const onSearch = () => {}';
  if (
    typeof config.search === 'object' &&
    typeof config.search.searchHooks === 'string'
  ) {
    content = await fs.readFile(config.search.searchHooks, 'utf-8');
  }
  const modulePath = join(
    context.runtimeTempDir,
    `${RuntimeModuleID.SearchHooks}.ts`,
  );

  return new RuntimeModulesPlugin({
    [modulePath]: content,
  });
}
