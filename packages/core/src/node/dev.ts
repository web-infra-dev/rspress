import type { RsbuildConfig } from '@rsbuild/core';
import type { UserConfig } from '@rspress/shared';
import { initRsbuild } from './initRsbuild';
import { PluginDriver } from './PluginDriver';
import { RouteService } from './route/RouteService';
import { checkLanguageParity } from './utils/checkLanguageParity';

interface ServerInstance {
  close: () => Promise<void>;
}

interface DevOptions {
  appDirectory: string;
  docDirectory: string;
  config: UserConfig;
  configFilePath: string;
  extraBuilderConfig?: RsbuildConfig;
}

export async function dev(options: DevOptions): Promise<ServerInstance> {
  const { docDirectory, config, extraBuilderConfig, configFilePath } = options;
  const isProd = false;
  // 1. create PluginDriver
  const pluginDriver = await PluginDriver.create(
    config,
    configFilePath,
    isProd,
  );
  const modifiedConfig = await pluginDriver.modifyConfig();

  try {
    // 2. create RouteService
    const additionalPages = await pluginDriver.addPages();
    const routeService = await RouteService.create({
      config: modifiedConfig,
      scanDir: docDirectory,
      externalPages: additionalPages,
    });
    await pluginDriver.routeGenerated(routeService.getRoutes());
    await pluginDriver.routeServiceGenerated(routeService);

    // 3. rsbuild.dev
    await pluginDriver.beforeBuild();
    const rsbuild = await initRsbuild(
      docDirectory,
      modifiedConfig,
      pluginDriver,
      routeService,
      false,
      extraBuilderConfig,
    );
    rsbuild.onAfterDevCompile(async () => {
      await pluginDriver.afterBuild();
    });
    const { server } = await rsbuild.startDevServer({
      // We will support the following options in the future
      getPortSilently: true,
    });

    return server;
  } finally {
    await checkLanguageParity(modifiedConfig);
  }
}
