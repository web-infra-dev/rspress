import { join } from 'node:path';
import type { TransformHandler } from '@rsbuild/core';
import type { UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { type FactoryContext, RuntimeModuleID } from '.';

const DEFAULT_I18N_SOURCE = join(process.cwd(), 'i18n.json');

export function getI18nData(docConfig: UserConfig) {
  const { i18nSourcePath = DEFAULT_I18N_SOURCE } = docConfig;
  try {
    // require.cache is an API in Rslib.
    delete REQUIRE_CACHE[i18nSourcePath];
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
export function i18nVMPlugin(
  context: Omit<FactoryContext, 'isSSR' | 'alias'>,
): Record<string, TransformHandler> {
  const { config } = context;
  return {
    [RuntimeModuleID.I18nText]: ({ addDependency, addMissingDependency }) => {
      addDependency(config.i18nSourcePath || DEFAULT_I18N_SOURCE);
      addMissingDependency(config.i18nSourcePath || DEFAULT_I18N_SOURCE);
      const i18nData = getI18nData(config);

      return `export default ${JSON.stringify(i18nData, null, 2)}`;
    },
  };
}
