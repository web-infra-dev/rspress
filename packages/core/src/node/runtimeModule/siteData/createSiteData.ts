import {
  addLeadingSlash,
  addTrailingSlash,
  type SiteData,
  type UserConfig,
} from '@rspress/shared';
import { getIconUrlPath } from '@rspress/shared/node-utils';
import { normalizeThemeConfig } from './normalizeThemeConfig';

export async function createSiteData(userConfig: UserConfig): Promise<{
  siteData: Omit<SiteData, 'root' | 'pages'>;
}> {
  // prevent modify the origin config object
  const tempSearchObj = Object.assign({}, userConfig.search);

  // searchHooks is a absolute path which may leak information
  if (tempSearchObj) {
    tempSearchObj.searchHooks = undefined;
  }

  const { base } = userConfig;

  // TODO: base can be normalized in compile time side in an earlier stage
  const normalizedBase = addTrailingSlash(addLeadingSlash(base ?? '/'));

  const siteData: Omit<SiteData, 'root' | 'pages'> = {
    base: normalizedBase,
    title: userConfig?.title || '',
    description: userConfig?.description || '',
    icon: getIconUrlPath(userConfig?.icon) || '',
    route: userConfig?.route || {},
    themeConfig: normalizeThemeConfig(userConfig),
    lang: userConfig?.lang || '',
    locales: userConfig?.locales || userConfig.themeConfig?.locales || [],
    logo: userConfig?.logo || '',
    logoText: userConfig?.logoText || '',
    multiVersion: {
      default: userConfig?.multiVersion?.default || '',
      versions: userConfig?.multiVersion?.versions || [],
    },
    search: tempSearchObj ?? { mode: 'local' },
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
