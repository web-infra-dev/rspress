import {
  addLeadingSlash,
  type DefaultThemeConfig,
  isExternalUrl,
  type NavItem,
  type NavItemWithLink,
  type NormalizedDefaultThemeConfig,
  type NormalizedSidebarGroup,
  normalizeHref,
  type Sidebar,
  type SidebarDivider,
  type SidebarGroup,
  type SidebarItem,
  type SidebarSectionHeader,
  slash,
  type UserConfig,
} from '@rspress/shared';
import { applyReplaceRules } from '../../utils/applyReplaceRules';
import { getI18nData } from '../i18n';

export async function normalizeThemeConfig(
  docConfig: UserConfig,
): Promise<NormalizedDefaultThemeConfig> {
  const {
    locales: siteLocales,
    lang,
    replaceRules = [],
    multiVersion,
  } = docConfig;
  const { versions = [] } = multiVersion || {};
  const hasMultiVersion = versions.length > 0;
  docConfig.themeConfig = docConfig.themeConfig || {};
  const { themeConfig } = docConfig;
  const locales = siteLocales ?? (themeConfig?.locales || []);
  const i18nTextData = await getI18nData(docConfig);
  // In following code, we will normalize the theme config reference to the pages data extracted from mdx files
  const normalizeLinkPrefix = (link: string, currentLang: string) => {
    const normalizedLink = slash(link);
    if (
      !currentLang ||
      !link ||
      normalizedLink.startsWith(`/${currentLang}`) ||
      isExternalUrl(normalizedLink) ||
      hasMultiVersion
    ) {
      return normalizedLink;
    }
    // if lang exists, we should add the lang prefix to the link
    // such /guide -> /en/guide
    return lang === currentLang
      ? normalizedLink
      : `/${currentLang}${addLeadingSlash(normalizedLink)}`;
  };

  const getI18nText = (key: string, currentLang: string) => {
    const text = i18nTextData[key]?.[currentLang];
    return text || key;
  };

  // we do cleanUrls in runtime side
  const cleanUrls = false;
  const transformLink = (link: string, currentLang: string) => {
    return normalizeHref(normalizeLinkPrefix(link, currentLang), cleanUrls);
  };

  const textReplace = (text: string, currentLang: string) => {
    return applyReplaceRules(getI18nText(text, currentLang), replaceRules);
  };

  // Normalize sidebar
  const normalizeSidebar = (
    sidebar: DefaultThemeConfig['sidebar'],
    currentLang: string,
  ): NormalizedDefaultThemeConfig['sidebar'] => {
    const normalizedSidebar: NormalizedDefaultThemeConfig['sidebar'] = {};
    if (!sidebar) {
      return {};
    }
    const normalizeSidebarItem = (
      item: SidebarGroup | SidebarItem | SidebarDivider | SidebarSectionHeader,
    ):
      | NormalizedSidebarGroup
      | SidebarItem
      | SidebarDivider
      | SidebarSectionHeader => {
      // Meet the divider, return directly
      if (typeof item === 'object' && 'dividerType' in item) {
        return item;
      }

      // Meet the section header, return i18n text
      if (typeof item === 'object' && 'sectionHeaderText' in item) {
        item.sectionHeaderText = textReplace(
          item.sectionHeaderText,
          currentLang,
        );
        return item;
      }

      if (typeof item === 'object' && 'items' in item) {
        return {
          ...item,
          text: textReplace(item.text, currentLang),
          ...('link' in item && item.link
            ? { link: transformLink(item.link, currentLang) }
            : {}),
          collapsed: item.collapsed ?? false,
          collapsible: item.collapsible ?? true,
          items: item.items.map(subItem => {
            return normalizeSidebarItem(subItem) as
              | NormalizedSidebarGroup
              | SidebarItem;
          }),
        };
      }

      return {
        ...item,
        text: textReplace(item.text, currentLang),
        link: transformLink(item.link, currentLang),
      };
    };

    const normalizeSidebar = (sidebar: Sidebar) => {
      Object.keys(sidebar).forEach(key => {
        const value = sidebar[key];
        normalizedSidebar[key] = value.map(normalizeSidebarItem) as (
          | NormalizedSidebarGroup
          | SidebarItem
        )[];
      });
    };

    normalizeSidebar(sidebar);

    return normalizedSidebar;
  };

  const normalizeNav = (
    nav: DefaultThemeConfig['nav'] | undefined,
    currentLang: string,
  ) => {
    if (!nav) {
      return [];
    }
    const transformNavItem = <T extends NavItem>(navItem: T): T => {
      return {
        ...navItem,
        ...(navItem.text
          ? { text: textReplace(navItem.text, currentLang) }
          : {}),
        ...('link' in navItem
          ? { link: transformLink(navItem.link, currentLang) }
          : {}),
        ...('items' in navItem
          ? {
              items: navItem.items.map((item: NavItemWithLink) => {
                return transformNavItem(item);
              }),
            }
          : {}),
      };
    };

    if (Array.isArray(nav)) {
      return nav.map(transformNavItem);
    }

    // Multi version case
    return Object.entries<NavItem[]>(nav).reduce(
      (acc, [key, value]) => {
        acc[key] = value.map(transformNavItem);
        return acc;
      },
      {} as Record<string, NavItem[]>,
    );
  };

  /**
   * There are two place the user will define the locales:
   * 1. in the `doc.locales` (the site config)
   * 2. in the `doc.themeConfig.locales`
   * The locales in the theme config will override the locales in the site config.
   *
   * For nav and sidebar, we prefer the locales in the `themeConfig.nav` and `themeConfig.sidebar` if it exists. And Rspress will generate complete nav and sidebar for each locale and place them in the `themeConfig.locales` field.
   */
  if (locales.length) {
    themeConfig.locales = locales.map(({ lang: currentLang, label }) => {
      const localeInThemeConfig = themeConfig.locales?.find(
        locale => locale.lang === currentLang,
      );
      return {
        lang: currentLang,
        label,
        ...localeInThemeConfig,
        sidebar: normalizeSidebar(
          localeInThemeConfig?.sidebar ?? themeConfig.sidebar,
          currentLang,
        ),
        nav: normalizeNav(
          localeInThemeConfig?.nav ?? themeConfig.nav,
          currentLang,
        ),
      };
    });
  } else {
    themeConfig.sidebar = normalizeSidebar(themeConfig?.sidebar, '');
    themeConfig.nav = normalizeNav(themeConfig?.nav, '');
  }
  return themeConfig as NormalizedDefaultThemeConfig;
}
