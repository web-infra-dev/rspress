import path from 'node:path';
import { RuntimeModuleID, type VirtualModulePlugin } from './types';

export const searchHookVMPlugin: VirtualModulePlugin = context => {
  return {
    [`${RuntimeModuleID.SearchHooks}`]: () => {
      const { config } = context;
      let content = 'export const onSearch = () => {};';

      const searchHooks =
        typeof config.search === 'object' && config.search?.searchHooks;

      if (searchHooks) {
        content = `export * from ${JSON.stringify(path.posix.normalize(searchHooks))}`;
      }
      return content;
    },
  };
};
