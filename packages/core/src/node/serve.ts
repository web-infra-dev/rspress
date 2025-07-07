import { type RsbuildInstance, mergeRsbuildConfig } from '@rsbuild/core';
import type { UserConfig } from '@rspress/shared';
import { PluginDriver } from './PluginDriver';
import { initRsbuild } from './initRsbuild';

interface ServeOptions {
  config: UserConfig;
  configFilePath: string;
  port?: number;
  host?: string;
}

// Serve ssg site in production
export async function serve(
  options: ServeOptions,
): Promise<ReturnType<RsbuildInstance['preview']>> {
  const { config, port: userPort, host: userHost, configFilePath } = options;
  const envPort = process.env.PORT;
  const envHost = process.env.HOST;
  const { builderConfig } = config;
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

  const pluginDriver = new PluginDriver(config, configFilePath, true);
  await pluginDriver.init();

  const modifiedConfig = await pluginDriver.modifyConfig();

  const rsbuild = await initRsbuild(
    config.root!,
    modifiedConfig,
    pluginDriver,
    false,
  );

  return rsbuild.preview();
}
