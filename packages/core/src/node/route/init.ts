import type { UserConfig } from '@rspress/shared';
import type { PluginDriver } from '../PluginDriver';
import { RouteService } from './RouteService';

interface InitOptions {
  scanDir: string;
  config: UserConfig;
  runtimeTempDir: string;
  pluginDriver: PluginDriver;
}

export let routeService: RouteService | null = null;

// The factory to create route service instance
export async function initRouteService(
  options: InitOptions,
): Promise<RouteService> {
  const { scanDir, config, runtimeTempDir, pluginDriver } = options;
  routeService = new RouteService(
    scanDir,
    config,
    runtimeTempDir,
    pluginDriver,
  );
  await routeService.init();
  await pluginDriver.routeServiceGenerated(routeService);
  return routeService;
}
