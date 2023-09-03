import { join } from 'path';
import { createRequire } from 'module';
import { UserConfig } from '@rspress/shared';
import { RspackVirtualModulePlugin } from 'rspack-plugin-virtual-module';
import { FactoryContext, RuntimeModuleID } from '.';

const require = createRequire(import.meta.url);

const DEFAULT_I18N_SOURCE = join(process.cwd(), 'i18n.json');

export function getI18nData(docConfig: UserConfig) {
  const { i18nSourcePath = DEFAULT_I18N_SOURCE } = docConfig;
  try {
    // eslint-disable-next-line import/no-dynamic-require
    const i18nSource = require(i18nSourcePath);
    return i18nSource;
  } catch (e) {
    return {};
  }
}

export function i18nVMPlugin(context: FactoryContext) {
  const { config } = context;
  const i18nData = getI18nData(config);
  return new RspackVirtualModulePlugin({
    [RuntimeModuleID.I18nText]: `export default ${JSON.stringify(i18nData)}`,
  });
}
