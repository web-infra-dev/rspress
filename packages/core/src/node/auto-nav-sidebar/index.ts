import path from 'node:path';
import type { NavItem, Sidebar, UserConfig } from '@rspress/shared';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';
import { combineWalkResult, processLocales } from './locales';
import { walk } from './walk';

async function runAutoNavSide(
  config: UserConfig,
  metaFileSet: Set<string>,
): Promise<
  | { nav: Record<string, NavItem[]>; sidebar: Sidebar }[]
  | {
      nav: Record<string, NavItem[]>;
      sidebar: Sidebar;
    }
> {
  config.themeConfig = config.themeConfig || {};
  config.themeConfig.locales =
    config.themeConfig.locales || config.locales || [];
  const langs = config.themeConfig.locales.map(locale => locale.lang);
  const hasLocales = langs.length > 0;
  const versions = config.multiVersion?.versions || [];
  const { extensions = DEFAULT_PAGE_EXTENSIONS } = config?.route || {};

  if (hasLocales) {
    const metaInfo = await processLocales(
      langs,
      versions,
      config.root!,
      extensions,
      metaFileSet,
    );
    return metaInfo;
  }

  const walks = versions.length
    ? await Promise.all(
        versions.map(version => {
          return walk(
            path.join(config.root!, version),
            config.root!,
            extensions,
            metaFileSet,
          );
        }),
      )
    : [await walk(config.root!, config.root!, extensions, metaFileSet)];

  const combined = combineWalkResult(walks, versions);

  return combined;
}

export function haveNavSidebarConfig(config: UserConfig) {
  const themeConfig = config.themeConfig || {};
  const haveNavSidebarConfig =
    themeConfig.nav ||
    themeConfig.sidebar ||
    themeConfig.locales?.[0]?.nav ||
    themeConfig.locales?.[0]?.sidebar;
  return Boolean(haveNavSidebarConfig);
}

export async function modifyConfigWithAutoNavSide(
  config: UserConfig,
  metaFileSet: Set<string> = new Set<string>(),
  force: boolean = false,
): Promise<void> {
  if (haveNavSidebarConfig(config) && !force) {
    return;
  }
  const autoNavSide = await runAutoNavSide(config, metaFileSet);
  if (autoNavSide === null) {
    return;
  }

  if (Array.isArray(autoNavSide)) {
    config.themeConfig = config.themeConfig || {};
    config.themeConfig.locales = config.themeConfig.locales || [];
    config.themeConfig.locales = config.themeConfig.locales.map(
      (item, index) => ({
        ...item,
        ...autoNavSide[index],
      }),
    );
    return;
  }

  config.themeConfig = config.themeConfig || {};
  config.themeConfig.nav = autoNavSide.nav;
  config.themeConfig.sidebar = autoNavSide.sidebar;
  return;
}
