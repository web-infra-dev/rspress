import { join } from 'node:path';
import type { UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { applyReplaceRules } from '../utils';
import { RuntimeModuleID, type VirtualModulePlugin } from './types';

const DEFAULT_I18N_SOURCE = join(process.cwd(), 'i18n.json');

interface I18n {
  // key: text id
  [key: string]: {
    // key: language
    [key: string]: string;
  };
}

export function getI18nData(docConfig: UserConfig): I18n {
  const { i18nSourcePath = DEFAULT_I18N_SOURCE } = docConfig;
  try {
    // require.cache is an API in Rslib.
    delete REQUIRE_CACHE[i18nSourcePath];
    // eslint-disable-next-line import/no-dynamic-require
    const i18nSource = require(i18nSourcePath) as I18n;
    for (const key in i18nSource) {
      const langMap = i18nSource[key];
      if (typeof langMap !== 'object' || Array.isArray(langMap)) {
        logger.warn(
          `Invalid i18n data for key "${key}": ${JSON.stringify(langMap)}`,
        );
        continue;
      }
      for (const langKey in langMap) {
        const text = langMap[langKey];
        langMap[langKey] = applyReplaceRules(text);
      }
    }
    return i18nSource;
  } catch (e) {
    logger.debug('getI18nData Failed: \n', e);
    return {};
  }
}

/**
 * Generate i18n text for client runtime
 */
export const i18nVMPlugin: VirtualModulePlugin = context => {
  const { config } = context;
  return {
    [RuntimeModuleID.I18nText]: ({ addDependency, addMissingDependency }) => {
      addDependency(config.i18nSourcePath || DEFAULT_I18N_SOURCE);
      addMissingDependency(config.i18nSourcePath || DEFAULT_I18N_SOURCE);
      const i18nData = getI18nData(config);

      return `export default ${JSON.stringify(i18nData, null, 2)}`;
    },
  };
};
