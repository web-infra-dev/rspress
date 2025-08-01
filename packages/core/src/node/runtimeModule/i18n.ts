import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { RuntimeModuleID, type VirtualModulePlugin } from './types';

const require = createRequire(import.meta.url);
const DEFAULT_I18N_SOURCE = join(process.cwd(), 'i18n.json');

export function getI18nData(docConfig: UserConfig) {
  const { i18nSourcePath = DEFAULT_I18N_SOURCE } = docConfig;
  try {
    // require.cache is an API in Rslib.
    delete require.cache[i18nSourcePath];
    // eslint-disable-next-line import/no-dynamic-require
    const i18nSource = require(i18nSourcePath);
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
