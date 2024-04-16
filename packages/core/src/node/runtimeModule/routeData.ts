import { FactoryContext, RuntimeModuleID } from '.';

export async function routeVMPlugin(context: FactoryContext) {
  const { routeService } = context;
  // client: The components of route is lazy loaded
  return {
    [RuntimeModuleID.RouteForClient]: routeService.generateRoutesCode(false),
    [RuntimeModuleID.RouteForSSR]: routeService.generateRoutesCode(true),
  };
}
