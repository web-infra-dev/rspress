import type { UserConfig } from '@rspress/shared';
import { modifyConfigWithAutoNavSide } from './auto-nav-sidebar';
import { initRsbuild } from './initRsbuild';
import { hintSSGFalse } from './logger/hint';
import { PluginDriver } from './PluginDriver';
import { RouteService } from './route/RouteService';
import { checkLanguageParity } from './utils/checkLanguageParity';

interface BuildOptions {
  docDirectory: string;
  config: UserConfig;
  configFilePath: string;
}

export async function build(options: BuildOptions) {
  const { docDirectory, config, configFilePath } = options;
  // 1. create PluginDriver
  const pluginDriver = await PluginDriver.create(config, configFilePath, true);
  const modifiedConfig = await pluginDriver.modifyConfig();
  const ssgConfig = Boolean(modifiedConfig.ssg ?? true);

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

  try {
    // 3. rsbuild build
    await pluginDriver.beforeBuild();
    // if enableSSG, build both client and server bundle
    // else only build client bundle
    const rsbuild = await initRsbuild(
      docDirectory,
      modifiedConfig,
      pluginDriver,
      routeService,
      ssgConfig,
    );
    await rsbuild.build();
  } finally {
    await checkLanguageParity(config);
  }
  await pluginDriver.afterBuild();

  if (!ssgConfig) {
    hintSSGFalse();
  }
}
