import { addLeadingSlash } from '@rspress/shared';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import { FactoryContext, RuntimeModuleID } from '.';

export const normalizeRoutePath = (routePath: string) => {
  const result = routePath.replace(/\.(.*)?$/, '').replace(/index$/, '');
  return addLeadingSlash(result);
};

export async function routeVMPlugin(context: FactoryContext) {
  const { routeService } = context;
  // client: The components of route is lazy loaded
  const plugin = new RspackVirtualModulePlugin({
    [RuntimeModuleID.RouteForClient]: routeService.generateRoutesCode(false),
    [RuntimeModuleID.RouteForSSR]: routeService.generateRoutesCode(true),
  });
  return plugin;
}
