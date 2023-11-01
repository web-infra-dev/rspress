import { UserConfig, removeLeadingSlash } from '@rspress/shared';
import type { RsbuildConfig } from '@rsbuild/core';
import { logger } from '@rspress/shared/logger';
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
  const base = config?.base ?? '';
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
    const { server } = await builder.startDevServer({
      printURLs: urls => {
        return urls.map(({ label, url }) => ({
          label,
          url: `${url}/${removeLeadingSlash(base)}`,
        }));
      },
      // We will support the following options in the future
      getPortSilently: true,
      logger,
    });

    await pluginDriver.afterBuild();
    return server;
  } finally {
    await writeSearchIndex(config);
  }
}
