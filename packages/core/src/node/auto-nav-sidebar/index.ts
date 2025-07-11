import path from 'node:path';
import type { UserConfig } from '@rspress/shared';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';
import { logger } from '@rspress/shared/logger';
import { combineWalkResult, processLocales } from './locales';
import { walk } from './walk';

export async function modifyConfigWithAutoNavSide(
  config: UserConfig,
): Promise<UserConfig> {
  const themeConfig = config.themeConfig || {};

  const haveNavSidebarConfig =
    themeConfig.nav ||
    themeConfig.sidebar ||
    themeConfig.locales?.[0]?.nav ||
    themeConfig.locales?.[0]?.sidebar;

  if (haveNavSidebarConfig) {
    return config;
  }

  config.themeConfig = config.themeConfig || {};
  config.themeConfig.locales =
    config.themeConfig.locales || config.locales || [];
  const langs = config.themeConfig.locales.map(locale => locale.lang);
  const hasLocales = langs.length > 0;
  const hasLang = Boolean(config.lang);
  const versions = config.multiVersion?.versions || [];
  const { extensions = DEFAULT_PAGE_EXTENSIONS } = config?.route || {};

  if (hasLocales) {
    const metaInfo = await processLocales(
      langs,
      versions,
      config.root!,
      extensions,
    );
    config.themeConfig.locales = config.themeConfig.locales.map(
      (item, index) => ({
        ...item,
        ...metaInfo[index],
      }),
    );
  } else {
    if (hasLang) {
      logger.error(
        '`lang` is configured but `locales` not, ' +
          'thus `auto-nav-sidebar` can not auto generate ' +
          'navbar level config correctly!\n' +
          'please check your config file',
      );
      return config;
    }
    const walks = versions.length
      ? await Promise.all(
          versions.map(version => {
            return walk(
              path.join(config.root!, version),
              config.root!,
              extensions,
            );
          }),
        )
      : [await walk(config.root!, config.root!, extensions)];

    const combined = combineWalkResult(walks, versions);

    config.themeConfig = { ...config.themeConfig, ...combined };
  }

  return config;
}
