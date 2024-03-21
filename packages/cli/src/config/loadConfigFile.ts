import fs from 'fs';
import path from 'path';
import type { UserConfig } from '@rspress/core';
import { DEFAULT_CONFIG_NAME, DEFAULT_EXTENSIONS } from '@/constants';

const findConfig = (basePath: string): string | undefined => {
  return DEFAULT_EXTENSIONS.map(ext => basePath + ext).find(fs.existsSync);
};

export async function loadConfigFile(
  customConfigFile?: string,
): Promise<UserConfig> {
  const baseDir = process.cwd();
  let configFilePath = '';
  if (customConfigFile) {
    if (path.isAbsolute(customConfigFile)) {
      configFilePath = customConfigFile;
    } else {
      configFilePath = path.join(baseDir, customConfigFile);
    }
  } else {
    configFilePath = findConfig(path.join(baseDir, DEFAULT_CONFIG_NAME))!;
  }
  if (!configFilePath) {
    console.log('no config file found');
    return {};
  }

  const { loadConfig } = await import('@rsbuild/core');
  const { content } = await loadConfig({
    cwd: path.dirname(configFilePath),
    path: configFilePath,
  });

  return content as UserConfig;
}
