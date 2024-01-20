import { UserConfig } from '@rspress/shared';
import { type RsbuildConfig } from '@rsbuild/core';
import { initRsbuild } from './initRsbuild';
import { writeSearchIndex } from './searchIndex';
import { PluginDriver } from './PluginDriver';

interface ServerInstance {
  close: () => Promise<void>;
}

interface DevOptions {
  appDirectory: string;
  docDirectory: string;
  config: UserConfig;
  extraBuilderConfig?: RsbuildConfig;
}

export async function dev(options: DevOptions): Promise<ServerInstance> {
  const { docDirectory, config, extraBuilderConfig } = options;
  const isProd = false;
  const pluginDriver = new PluginDriver(config, isProd);
  await pluginDriver.init();

  try {
    const modifiedConfig = await pluginDriver.modifyConfig();
    await pluginDriver.beforeBuild();

    // empty temp dir before build
    // await fs.emptyDir( TEMP_DIR);
    const builder = await initRsbuild(
      docDirectory,
      modifiedConfig,
      pluginDriver,
      false,
      extraBuilderConfig,
    );
    builder.onDevCompileDone(async () => {
      await pluginDriver.afterBuild();
    });
    const { server } = await builder.startDevServer({
      // We will support the following options in the future
      getPortSilently: true,
    });

    return server;
  } finally {
    await writeSearchIndex(config);
  }
}
