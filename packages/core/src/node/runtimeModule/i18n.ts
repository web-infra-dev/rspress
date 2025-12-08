import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import picocolors from 'picocolors';
import type { PluginDriver } from '../PluginDriver';
import { createError, pathExists } from '../utils';
import { DEFAULT_I18N_TEXT } from './DEFAULT_I18N_TEXT';
import { RuntimeModuleID, type VirtualModulePlugin } from './types';

const require = createRequire(import.meta.url);
const DEFAULT_I18N_SOURCE_PATH = join(process.cwd(), 'i18n.json');

function mergeI18nData(
  ...sources: Record<string, Record<string, string>>[]
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const source of sources) {
    for (const key in source) {
      if (!result[key]) {
        result[key] = {};
      }
      Object.assign(result[key], source[key]);
    }
  }
  return result;
}
const logPrefix = '[i18n]';
const logKeys = new Set<string>();
let logged = false;

export async function getI18nData(
  docConfig: UserConfig,
  pluginDriver?: PluginDriver,
): Promise<Record<string, Record<string, string>>> {
  const {
    i18nSourcePath = DEFAULT_I18N_SOURCE_PATH,
    i18nSource = {},
    themeConfig,
    locales,
  } = docConfig;

  let langs: string[] =
    (locales ?? themeConfig?.locales)?.map(locale => locale.lang) ?? [];
  if (langs.length === 0) {
    langs = [docConfig.lang ?? 'en'];
  }
  // 0. load default value
  let i18nSourceFull: Record<string, Record<string, string>> = JSON.parse(
    JSON.stringify(DEFAULT_I18N_TEXT),
  );

  // 1. modified by plugin (default value)
  const i18nSourceFromPlugin = await pluginDriver?.i18nSource(i18nSourceFull);
  if (i18nSourceFromPlugin) {
    i18nSourceFull = i18nSourceFromPlugin;
  }

  // 2. load i18nSource from i18n.json
  let i18nSourceFromJson: Record<string, Record<string, string>> = {};
  try {
    delete require.cache[i18nSourcePath];
    i18nSourceFromJson = require(i18nSourcePath);
  } catch (e) {
    logger.debug('getI18nData from i18n.json Failed: \n', e);
  }

  i18nSourceFull = mergeI18nData(i18nSourceFull, i18nSourceFromJson);

  // 3. load i18nSource from rspress.config.ts
  if (typeof i18nSource === 'function') {
    try {
      i18nSourceFull = await i18nSource(i18nSourceFull);
    } catch (e) {
      logger.error(
        `${logPrefix} getI18nData Failed to execute \`i18nSource\` function in \`rspress.config.ts\`: \n`,
        e,
      );
      throw e;
    }
  } else {
    i18nSourceFull = mergeI18nData(i18nSourceFull, i18nSource);
  }

  // 4. select langs from i18nSourceFull for treeshaking
  const cyan = picocolors.cyan;
  const filteredI18nSource: Record<string, Record<string, string>> = {};
  for (const key in i18nSourceFull) {
    filteredI18nSource[key] = {};
    for (const lang of langs) {
      if (i18nSourceFull[key][lang]) {
        filteredI18nSource[key][lang] = i18nSourceFull[key][lang];
      } else {
        // fallback to 'en'
        const enText = i18nSourceFull[key].en;
        logKeys.add(key);

        if (enText) {
          filteredI18nSource[key][lang] = enText;
        } else {
          logger.error(
            `${logPrefix} i18n key ${cyan(key)} has no text for lang ${cyan(lang)}, and no fallback ${cyan('en')} text either.`,
          );
          throw createError(`i18n text missing for ${picocolors.cyan(key)}`);
        }
      }
    }
  }

  if (logKeys.size > 0 && !logged) {
    logger.warn(
      `${logPrefix} The following i18n keys are missing for some languages and have fallen back to 'en': 
      ${picocolors.gray(JSON.stringify(Object.fromEntries([...logKeys.keys()].map(i => [i, '...'])), null, 2))}`,
    );
    logged = true;
  }

  return filteredI18nSource;
}

/**
 * Generate i18n text for client runtime
 */
export const i18nVMPlugin: VirtualModulePlugin = context => {
  const { config, pluginDriver } = context;
  return {
    [RuntimeModuleID.I18nText]: async ({
      addDependency,
      addMissingDependency,
    }) => {
      const configPath = config.i18nSourcePath || DEFAULT_I18N_SOURCE_PATH;

      const isExist = await pathExists(configPath);
      if (isExist) {
        addDependency(configPath);
      } else {
        addMissingDependency(configPath);
      }
      const i18nData = await getI18nData(config, pluginDriver);

      return `export default ${JSON.stringify(i18nData, null, 2)}`;
    },
  };
};
