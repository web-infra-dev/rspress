import {
  type LoadConfigResult,
  mergeRsbuildConfig,
  type RsbuildInstance,
} from '@rsbuild/core';
import type { UserConfig } from '@rspress/shared';
import { normalizeConfigResult } from '../config/loadConfigFile';
import { initRsbuild } from './initRsbuild';
import { PluginDriver } from './PluginDriver';
import { RouteService } from './route/RouteService';

interface ServeOptions {
  config: UserConfig | LoadConfigResult<UserConfig>;
  configFilePath?: string;
  port?: number;
  host?: string;
}

// Serve ssg site in production
export async function serve(
  options: ServeOptions,
): Promise<ReturnType<RsbuildInstance['preview']>> {
  const { port: userPort, host: userHost } = options;
  const configResult = normalizeConfigResult(
    options.config,
    options.configFilePath,
  );
  const { content: config } = configResult;
  const envPort = process.env.PORT;
  const envHost = process.env.HOST;
  const { builderConfig = {} } = config;
  const port = Number(
    envPort || userPort || builderConfig?.server?.port || 4173,
  );
  const host =
    envHost || userHost || builderConfig?.server?.host || 'localhost';

  config.builderConfig = mergeRsbuildConfig(builderConfig, {
    server: {
      port,
      host,
    },
  });

  const pluginDriver = await PluginDriver.create(configResult.content, true);

  const modifiedConfig = await pluginDriver.modifyConfig();

  const rsbuild = await initRsbuild(
    config.root!,
    { ...configResult, content: modifiedConfig },
    pluginDriver,
    await RouteService.createSimple(),
    false,
  );

  return rsbuild.preview();
}
