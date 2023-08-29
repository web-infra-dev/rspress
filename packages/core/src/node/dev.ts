import { UserConfig, removeLeadingSlash } from '@rspress/shared';
import fs from '@modern-js/utils/fs-extra';
import { createModernBuilder } from './createBuilder';
import { writeSearchIndex } from './searchIndex';
import { PluginDriver } from './PluginDriver';
import { TEMP_DIR } from './constants';

interface ServerInstance {
  close: () => Promise<void>;
}

export interface Logger {
  info: (msg: string) => void;
  error: (msg: string) => void;
  warn: (msg: string) => void;
  success: (msg: string) => void;
  debug: (msg: string) => void;
  log: (msg: string) => void;
}

interface DevOptions {
  appDirectory: string;
  docDirectory: string;
  config: UserConfig;
  logger?: Logger;
}

export async function dev(options: DevOptions): Promise<ServerInstance> {
  const { docDirectory, config } = options;
  const base = config?.base ?? '';
  const isProd = false;
  const pluginDriver = new PluginDriver(config, isProd);
  await pluginDriver.init();

  try {
    const modifiedConfig = await pluginDriver.modifyConfig();
    await pluginDriver.beforeBuild();
    // empty temp dir before build
    await fs.emptyDir(TEMP_DIR);
    const builder = await createModernBuilder(
      docDirectory,
      modifiedConfig,
      pluginDriver,
      false,
      {},
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
      logger: options.logger,
    });

    await pluginDriver.afterBuild();
    return server;
  } finally {
    await writeSearchIndex(config);
  }
}
