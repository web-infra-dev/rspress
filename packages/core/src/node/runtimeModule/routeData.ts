import { FactoryContext, RuntimeModuleID } from '.';

export async function routeVMPlugin(context: FactoryContext) {
  const { routeService, isSSR } = context;

  // client: The components of route is lazy loaded
  if (!isSSR) {
    return {
      [RuntimeModuleID.RouteForClient]: routeService.generateRoutesCode(false),
    };
  }

  return {
    [RuntimeModuleID.RouteForClient]: routeService.generateRoutesCode(false),
    [RuntimeModuleID.RouteForSSR]: routeService.generateRoutesCode(true),
  };
}
