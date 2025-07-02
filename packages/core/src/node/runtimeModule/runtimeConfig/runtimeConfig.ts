import { type NavItem, type UserConfig, normalizeSlash } from '@rspress/shared';
import type { RouteService } from '../../route/RouteService';
import { RuntimeModuleID, type VirtualModulePlugin } from '../types';
import { normalizeNav } from './normalizeNav';

function extractNavConfig(
  docConfig: UserConfig,
  routeService: RouteService,
  userDocRoot: string,
  cleanUrls: boolean,
): NavItem[] | Record<string, NavItem[]> {
  const { locales, themeConfig = {} } = docConfig;

  const themeConfigLocales = locales ?? themeConfig.locales ?? [];

  if (themeConfigLocales.length) {
    const result: Record<string, NavItem[]> = {};

    for (const locale of themeConfigLocales) {
      const { lang: currentLang } = locale;

      const localeInThemeConfig = themeConfig.locales?.find(
        locale => locale.lang === currentLang,
      );
      console.log(localeInThemeConfig?.nav ?? themeConfig.nav, 3333444);

      result[currentLang] = normalizeNav(
        localeInThemeConfig?.nav ?? themeConfig.nav ?? [],
        currentLang,
        routeService,
        userDocRoot,
        cleanUrls,
      );
    }
    return result;
  }

  return normalizeNav(
    themeConfig?.nav ?? [],
    '',
    routeService,
    userDocRoot,
    cleanUrls,
  );
}

/**
 * some configuration in `rspress.config.ts` serialized from compile time side to runtime
 */
export const runtimeConfigVMPlugin: VirtualModulePlugin = context => {
  const { config, routeService, userDocRoot } = context;
  const cleanUrls = config?.route?.cleanUrls ?? false;

  const nav = extractNavConfig(config, routeService, userDocRoot, cleanUrls);
  console.log(2222, nav);

  return {
    [RuntimeModuleID.RuntimeConfig]: () => {
      const { base } = config;

      // TODO: base can be normalized in compile time side in an earlier stage
      const normalizedBase = normalizeSlash(base ?? '/');
      // Use named export for better tree-shaking support
      return `export const base = ${JSON.stringify(normalizedBase)};
export const nav = ${JSON.stringify(nav)};`;
    },
  };
};
