import type { SiteData, UserConfig } from '@rspress/shared';
import { getIconUrlPath } from '@rspress/shared/node-utils';
import { normalizeThemeConfig } from './normalizeThemeConfig';

export async function createSiteData(userConfig: UserConfig): Promise<{
  siteData: Omit<SiteData, 'root' | 'pages'>;
}> {
  const search =
    userConfig.search === false
      ? false
      : {
          mode: 'local' as const,
          ...userConfig.search,
          // searchHooks is an absolute path which may leak information
          searchHooks: undefined,
        };

  const siteData: Omit<SiteData, 'root' | 'pages'> = {
    base: userConfig.base ?? '/',
    siteOrigin: userConfig.siteOrigin ?? '',
    title: userConfig?.title || '',
    description: userConfig?.description || '',
    icon: getIconUrlPath(userConfig?.icon) || '',
    route: {
      useTransitions: true,
      ...userConfig?.route,
    },
    themeConfig: await normalizeThemeConfig(userConfig),
    lang: userConfig?.lang || '',
    locales: userConfig?.locales || userConfig.themeConfig?.locales || [],
    logo: userConfig?.logo || '',
    logoText: userConfig?.logoText || '',
    logoHref: userConfig?.logoHref || '',
    multiVersion: {
      default: userConfig?.multiVersion?.default || '',
      versions: userConfig?.multiVersion?.versions || [],
    },
    search,
    markdown: {
      showLineNumbers: userConfig?.markdown?.showLineNumbers ?? false,
      defaultWrapCode: userConfig?.markdown?.defaultWrapCode ?? false,
      shiki: {},
    },
  };

  return {
    siteData,
  };
}
