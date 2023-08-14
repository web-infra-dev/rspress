import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import interpret from 'interpret';
import rechoir from 'rechoir';
import type { UserConfig } from '@rspress/core';
import { findUpPackage } from './findUpPackage';
import { DEFAULT_CONFIG_NAME, DEFAULT_EXTENSIONS } from '@/constants';

interface RechoirError extends Error {
  failures: RechoirError[];
  error: Error;
}

const findConfig = (basePath: string): string | undefined => {
  return DEFAULT_EXTENSIONS.map(ext => basePath + ext).find(fs.existsSync);
};

const isTsFile = (configPath: string) => {
  const ext = path.extname(configPath);
  return /\.(c|m)?ts$/.test(ext);
};

const isEsmFile = (filePath: string, cwd = process.cwd()) => {
  const ext = path.extname(filePath);
  if (/\.(cjs|cts)$/.test(ext)) {
    return false;
  }
  if (/\.(mjs|mts)$/.test(ext)) {
    return true;
  } else {
    const packageJson = findUpPackage(cwd);
    return packageJson?.type === 'module';
  }
};

export function registerLoader(configPath: string) {
  const ext = path.extname(configPath);
  const extensions = Object.fromEntries(
    Object.entries(interpret.extensions).filter(([key]) => key === ext),
  );
  if (Object.keys(extensions).length === 0) {
    throw new Error(`config file "${configPath}" is not supported.`);
  }
  try {
    rechoir.prepare(extensions, configPath);
  } catch (error) {
    const failures = (error as RechoirError)?.failures;
    if (failures) {
      const messages = failures.map(failure => failure.error.message);
      throw new Error(`${messages.join('\n')}`);
    } else {
      throw error;
    }
  }
}

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
    return {};
  }

  if (isTsFile(configFilePath)) {
    registerLoader(configFilePath);
  }

  if (isEsmFile(configFilePath)) {
    const result = await import(configFilePath);
    if (result && typeof result === 'object' && 'default' in result) {
      return result.default || {};
    } else {
      return result;
    }
  } else {
    const require = createRequire(import.meta.url);
    // eslint-disable-next-line import/no-dynamic-require
    let result = require(configFilePath);
    // compatible with export default config in common ts config
    if (result && typeof result === 'object' && 'default' in result) {
      result = result.default || {};
    }
    return result;
  }
}
