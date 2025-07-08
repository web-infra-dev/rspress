import type { RsbuildConfig } from '@rsbuild/core';
import type { UserConfig } from '@rspress/shared';
import { PluginDriver } from './PluginDriver';
import { initRsbuild } from './initRsbuild';
import { writeSearchIndex } from './searchIndex';
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
  const pluginDriver = new PluginDriver(config, configFilePath, isProd);
  await pluginDriver.init();
  const modifiedConfig = await pluginDriver.modifyConfig();

  try {
    // empty temp dir before build
    const rsbuild = await initRsbuild(
      docDirectory,
      modifiedConfig,
      pluginDriver,
      false,
      extraBuilderConfig,
    );
    await pluginDriver.beforeBuild();
    rsbuild.onDevCompileDone(async () => {
      await pluginDriver.afterBuild();
    });
    const { server } = await rsbuild.startDevServer({
      // We will support the following options in the future
      getPortSilently: true,
    });

    return server;
  } finally {
    await writeSearchIndex(modifiedConfig);
    await checkLanguageParity(modifiedConfig);
  }
}
