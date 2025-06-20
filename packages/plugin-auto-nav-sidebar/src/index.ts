import path from 'node:path';
import { type RspressPlugin, addTrailingSlash } from '@rspress/shared';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';
import { logger } from '@rspress/shared/logger';
import { combineWalkResult } from './utils';
import { walk } from './walk';

function processLocales(
  langs: string[],
  versions: string[],
  root: string,
  defaultLang: string,
  defaultVersion: string,
  extensions: string[],
) {
  return Promise.all(
    langs.map(async lang => {
      const walks = versions.length
        ? await Promise.all(
            versions.map(version => {
              const routePrefix = addTrailingSlash(
                `${version === defaultVersion ? '' : `/${version}`}${
                  lang === defaultLang ? '' : `/${lang}`
                }`,
              );
              return walk(
                path.join(root, version, lang),
                routePrefix,
                root,
                extensions,
              );
            }),
          )
        : [
            await walk(
              path.join(root, lang),
              addTrailingSlash(lang === defaultLang ? '' : `/${lang}`),
              root,
              extensions,
            ),
          ];
      return combineWalkResult(walks, versions);
    }),
  );
}

export function pluginAutoNavSidebar(): RspressPlugin {
  return {
    name: 'auto-nav-sidebar',
    async config(config) {
      config.themeConfig = config.themeConfig || {};
      config.themeConfig.locales =
        config.themeConfig.locales || config.locales || [];
      const langs = config.themeConfig.locales.map(locale => locale.lang);
      const hasLocales = langs.length > 0;
      const hasLang = Boolean(config.lang);
      const versions = config.multiVersion?.versions || [];
      const defaultLang = config.lang || '';
      const { default: defaultVersion = '' } = config.multiVersion || {};
      const { extensions = DEFAULT_PAGE_EXTENSIONS } = config?.route || {};

      if (hasLocales) {
        const metaInfo = await processLocales(
          langs,
          versions,
          config.root!,
          defaultLang,
          defaultVersion,
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
              'thus `@rspress/plugin-auto-nav-sidebar` can not auto generate ' +
              'navbar level config correctly!\n' +
              'please check your config file',
          );
          return config;
        }
        const walks = versions.length
          ? await Promise.all(
              versions.map(version => {
                const routePrefix = addTrailingSlash(
                  version === defaultVersion ? '' : `/${version}`,
                );
                return walk(
                  path.join(config.root!, version),
                  routePrefix,
                  config.root!,
                  extensions,
                );
              }),
            )
          : [await walk(config.root!, '/', config.root!, extensions)];

        const combined = combineWalkResult(walks, versions);

        config.themeConfig = { ...config.themeConfig, ...combined };
      }

      return config;
    },
  };
}
