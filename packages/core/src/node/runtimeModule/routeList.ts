import { RuntimeModuleID, type VirtualModulePlugin } from './types';

// TODO: hmr with addContextDependency
export const routeListVMPlugin: VirtualModulePlugin = context => {
  const { routeService } = context;

  return {
    [RuntimeModuleID.Routes]: () => {
      return routeService.generateRoutesCode();
    },
  };
};
