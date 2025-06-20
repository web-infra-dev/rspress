import fs from 'node:fs/promises';
import type { UserConfig } from '@rspress/shared';
import { PluginDriver } from './PluginDriver';
import { TEMP_DIR } from './constants';
import { initRsbuild } from './initRsbuild';
import { hintSSGFalse } from './logger/hint';
import { writeSearchIndex } from './searchIndex';
import { checkLanguageParity } from './utils/checkLanguageParity';

interface BuildOptions {
  docDirectory: string;
  config: UserConfig;
}

export async function bundle(
  docDirectory: string,
  config: UserConfig,
  pluginDriver: PluginDriver,
  enableSSG: boolean,
) {
  try {
    // if enableSSG, build both client and server bundle
    // else only build client bundle
    const rsbuild = await initRsbuild(
      docDirectory,
      config,
      pluginDriver,
      enableSSG,
    );

    await pluginDriver.beforeBuild();
    await rsbuild.build();
  } finally {
    await writeSearchIndex(config);
    await checkLanguageParity(config);
  }
  await pluginDriver.afterBuild();
}

function emptyDir(path: string): Promise<void> {
  return fs.rm(path, { force: true, recursive: true });
}

export async function build(options: BuildOptions) {
  const { docDirectory, config } = options;
  const pluginDriver = new PluginDriver(config, true);
  await pluginDriver.init();
  const modifiedConfig = await pluginDriver.modifyConfig();

  const ssgConfig = modifiedConfig.ssg ?? true;

  // empty temp dir before build
  await emptyDir(TEMP_DIR);

  await bundle(docDirectory, modifiedConfig, pluginDriver, ssgConfig);

  if (!ssgConfig) {
    hintSSGFalse();
  }
}
