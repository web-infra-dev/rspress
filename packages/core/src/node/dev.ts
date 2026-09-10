import type { LoadConfigResult, RestartFn, RsbuildConfig } from '@rsbuild/core';
import type { UserConfig } from '@rspress/shared';
import { normalizeConfigResult } from '../config/loadConfigFile';
import { initRsbuild } from './initRsbuild';
import { PluginDriver } from './PluginDriver';
import { RouteService } from './route/RouteService';
import { checkLanguageParity } from './utils/checkLanguageParity';

interface ServerInstance {
  close: () => Promise<void>;
}

interface DevOptions {
  appDirectory?: string;
  docDirectory: string;
  config: UserConfig | LoadConfigResult<UserConfig>;
  configFilePath?: string;
  extraBuilderConfig?: RsbuildConfig;
  restart?: RestartFn;
}

export async function dev(options: DevOptions): Promise<ServerInstance> {
  const { docDirectory, extraBuilderConfig, restart } = options;
  const configResult = normalizeConfigResult(
    options.config,
    options.configFilePath,
  );
  // 1. create PluginDriver
  const pluginDriver = await PluginDriver.create(configResult.content, false);
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
      { ...configResult, content: modifiedConfig },
      pluginDriver,
      routeService,
      false,
      {
        extraRsbuildConfig: extraBuilderConfig,
        restart,
      },
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
