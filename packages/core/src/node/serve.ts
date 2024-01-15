import type { UserConfig } from '@rspress/shared';
import { mergeRsbuildConfig } from '@rsbuild/core';
import { initRsbuild } from './initRsbuild';
import { PluginDriver } from './PluginDriver';

interface ServeOptions {
  config: UserConfig;
  port?: number;
  host?: string;
}

// Serve ssg site in production
export async function serve(options: ServeOptions) {
  const { config, port: userPort, host: userHost } = options;
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

  const pluginDriver = new PluginDriver(config, true);
  await pluginDriver.init();

  const modifiedConfig = await pluginDriver.modifyConfig();

  const builder = await initRsbuild(
    config.root,
    modifiedConfig,
    pluginDriver,
    false,
  );

  await builder.preview();
}
