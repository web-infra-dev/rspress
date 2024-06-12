import path from 'node:path';
import { type FactoryContext, RuntimeModuleID } from '.';

export async function searchHookVMPlugin(context: FactoryContext) {
  const { config } = context;
  let content = 'export const onSearch = () => {};';
  let extname = '';
  if (
    typeof config.search === 'object' &&
    typeof config.search.searchHooks === 'string'
  ) {
    content = `export * from '${config.search.searchHooks}'`;
    extname = path.extname(config.search.searchHooks);
  }

  return {
    [`${RuntimeModuleID.SearchHooks}${extname}`]: content,
  };
}
