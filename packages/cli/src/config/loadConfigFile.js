import fs from 'node:fs';
import path from 'node:path';
import { logger } from '@rspress/shared/logger';
import { DEFAULT_CONFIG_NAME, DEFAULT_EXTENSIONS } from '@/constants';
const findConfig = basePath => {
  return DEFAULT_EXTENSIONS.map(ext => basePath + ext).find(fs.existsSync);
};
export async function loadConfigFile(customConfigFile) {
  const baseDir = process.cwd();
  let configFilePath = '';
  if (customConfigFile) {
    if (path.isAbsolute(customConfigFile)) {
      configFilePath = customConfigFile;
    } else {
      configFilePath = path.join(baseDir, customConfigFile);
    }
  } else {
    configFilePath = findConfig(path.join(baseDir, DEFAULT_CONFIG_NAME));
  }
  if (!configFilePath) {
    logger.info(`No config file found in ${baseDir}`);
    return {};
  }
  const { loadConfig } = await import('@rsbuild/core');
  const { content } = await loadConfig({
    cwd: path.dirname(configFilePath),
    path: configFilePath,
  });
  return content;
}
export function resolveDocRoot(cwd, cliRoot, configRoot) {
  // CLI root has highest priority
  if (cliRoot) {
    return path.join(cwd, cliRoot);
  }
  // Config root is next in priority
  if (configRoot) {
    return path.isAbsolute(configRoot)
      ? configRoot
      : path.join(cwd, configRoot);
  }
  // Default to 'docs' if no root is specified
  return path.join(cwd, 'docs');
}
