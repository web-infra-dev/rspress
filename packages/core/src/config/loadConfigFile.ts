import path from 'node:path';
import type { LoadConfigResult } from '@rsbuild/core';
import type { UserConfig } from '@rspress/shared';
import {
  DEFAULT_CONFIG_EXTENSIONS,
  DEFAULT_CONFIG_NAME,
} from '@rspress/shared/constants';
import { logger } from '@rspress/shared/logger';

export async function loadConfigFile(
  customConfigFile?: string,
): Promise<LoadConfigResult<UserConfig>> {
  const { loadConfig } = await import('@rsbuild/core');
  const result = await loadConfig<UserConfig>({
    path: customConfigFile,
    configFileNames: DEFAULT_CONFIG_EXTENSIONS.map(
      ext => DEFAULT_CONFIG_NAME + ext,
    ),
  });

  if (!result.filePath) {
    logger.info(`No config file found in ${process.cwd()}`);
  }

  return result;
}

export function normalizeConfigResult(
  config: UserConfig | LoadConfigResult<UserConfig>,
  configFilePath?: string,
): LoadConfigResult<UserConfig> {
  if ('content' in config && 'filePath' in config && 'dependencies' in config) {
    return config;
  }

  return {
    content: config,
    filePath: configFilePath || null,
    dependencies: [],
  };
}

export function resolveDocRoot(
  cwd: string,
  cliRoot?: string,
  configRoot?: string,
): string {
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
