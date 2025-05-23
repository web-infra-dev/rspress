import { RuntimeModuleID, type VirtualModulePlugin } from './types';

// TODO: hmr with addContextDependency
export const routeListVMPlugin: VirtualModulePlugin = context => {
  const { routeService } = context;

  // client: The components of route is lazy loaded
  return {
    [RuntimeModuleID.RouteForClient]: () =>
      routeService.generateRoutesCode(false),
    [RuntimeModuleID.RouteForSSR]: ({ environment }) => {
      return environment.name === 'node'
        ? routeService.generateRoutesCode(true)
        : '';
    },
  };
};
