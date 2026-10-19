import type {
  BaseRuntimePageInfo,
  NavItem,
  SidebarData,
} from '@rspress/shared';

export type PageInfo = Pick<
  BaseRuntimePageInfo,
  | 'title'
  | 'description'
  | 'routePath'
  | 'lang'
  | 'version'
  | 'toc'
  | 'frontmatter'
>;

export interface SiteInfo {
  title: string;
  description: string;
  base: string;
  siteOrigin: string;
  lang: string;
  version: string;
  locales: { lang: string; label: string }[];
  versions: string[];
  defaultVersion: string;
  nav: NavItem[];
  sidebar: SidebarData;
}

export interface NavigationResult {
  routePath: string;
  page: Pick<PageInfo, 'title' | 'description' | 'lang' | 'version'>;
  sections: { title: string; depth: number; routePath: string }[];
  previousPage: { title: string; routePath: string } | null;
  nextPage: { title: string; routePath: string } | null;
}
