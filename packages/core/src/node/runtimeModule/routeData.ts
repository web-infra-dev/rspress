import { type FactoryContext, RuntimeModuleID } from './types';

export async function routeVMPlugin(context: FactoryContext) {
  const { routeService, isSSR } = context;

  // client: The components of route is lazy loaded
  if (!isSSR) {
    return {
      [RuntimeModuleID.RouteForClient]: routeService.generateRoutesCode(false),
      [RuntimeModuleID.RouteForSSR]: '',
    };
  }

  return {
    [RuntimeModuleID.RouteForClient]: routeService.generateRoutesCode(false),
    [RuntimeModuleID.RouteForSSR]: routeService.generateRoutesCode(true),
  };
}
