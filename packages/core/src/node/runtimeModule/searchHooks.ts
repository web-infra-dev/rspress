import { RuntimeModuleID, type VirtualModulePlugin } from './types';

export const searchHookVMPlugin: VirtualModulePlugin = context => {
  return {
    [`${RuntimeModuleID.SearchHooks}`]: () => {
      const { config } = context;
      let content = 'export const onSearch = () => {};';
      if (
        typeof config.search === 'object' &&
        typeof config.search.searchHooks === 'string'
      ) {
        content = `export * from '${config.search.searchHooks}'`;
      }
      return content;
    },
  };
};
