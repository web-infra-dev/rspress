import type { LoadConfigResult, RsbuildInstance } from '@rsbuild/core';
import type { UserConfig } from '@rspress/shared';
import { normalizeConfigResult } from '../config/loadConfigFile';
import { modifyConfigWithAutoNavSide } from './auto-nav-sidebar';
import { createBuildReport } from './buildReport';
import { initRsbuild } from './initRsbuild';
import { hintSSGFalse } from './logger/hint';
import { PluginDriver } from './PluginDriver';
import { RouteService } from './route/RouteService';
import { checkLanguageParity } from './utils/checkLanguageParity';

interface BuildOptions {
  docDirectory: string;
  config: UserConfig | LoadConfigResult<UserConfig>;
  configFilePath?: string;
}

export async function build(options: BuildOptions) {
  const { docDirectory } = options;
  const configResult = normalizeConfigResult(
    options.config,
    options.configFilePath,
  );
  const { content: config } = configResult;
  // 1. create PluginDriver
  const pluginDriver = await PluginDriver.create(configResult.content, true);
  const modifiedConfig = await pluginDriver.modifyConfig();
  const enableSSG = Boolean(
    (modifiedConfig.ssg || modifiedConfig.llms) ?? true,
  );

  // 2. create RouteService
  const additionalPages = await pluginDriver.addPages();
  const routeService = await RouteService.create({
    config: modifiedConfig,
    scanDir: docDirectory,
    externalPages: additionalPages,
  });
  await pluginDriver.routeGenerated(routeService.getRoutes());
  await pluginDriver.routeServiceGenerated(routeService);

  // FIXME: for plugin-llms to obtain the sidebar config in beforeBuild hook
  await modifyConfigWithAutoNavSide(modifiedConfig);

  let rsbuild: RsbuildInstance;
  try {
    // 3. rsbuild build
    await pluginDriver.beforeBuild();
    // if enableSSG, build both client and server bundle
    // else only build client bundle
    rsbuild = await initRsbuild(
      docDirectory,
      { ...configResult, content: modifiedConfig },
      pluginDriver,
      routeService,
      enableSSG,
    );
    await rsbuild.build();
  } finally {
    await checkLanguageParity(config);
  }
  await pluginDriver.afterBuild();

  const report = await createBuildReport({
    rootPath: rsbuild.context.rootPath,
    environments: rsbuild.getNormalizedConfig().environments,
    routes: routeService.getRoutes(),
  }).catch(error => {
    rsbuild.logger.warn('Failed to print page sizes.');
    rsbuild.logger.warn(error);
    return '';
  });
  if (report) {
    rsbuild.logger.log(`\n${report}\n`);
  }

  if (!enableSSG) {
    hintSSGFalse();
  }
}
