export { matchPath } from '@rspress/runtime/server';

// TODO: do not expose so much pubic API
export type {
  Feature,
  FrontMatterMeta,
  Header,
  Hero,
  LocalSearchOptions,
  Nav,
  NavItem,
  NavItemWithChildren,
  NavItemWithLink,
  NavItemWithLinkAndChildren,
  NormalizedSidebarGroup,
  PageIndexInfo,
  RemotePageInfo,
  RouteMeta,
  RspressPlugin,
  Sidebar,
  SidebarData,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarSectionHeader,
  SocialLink,
  UserConfig,
} from '@rspress/shared';
export {
  getSidebarDataGroup,
  normalizeHref,
  normalizePosixPath,
  RSPRESS_TEMP_DIR,
  removeTrailingSlash,
  withBase,
} from '@rspress/shared';
export { logger } from '@rspress/shared/logger';
export {
  getIconUrlPath,
  getNodeAttribute,
  mergeDocConfig,
} from '@rspress/shared/node-utils';
// cli
export { defineConfig } from './cli/config';
export { build, dev, remarkFileCodeBlock, remarkLink, serve } from './node';
export type {
  CustomLinkMeta,
  DirSectionHeaderSideMeta,
  DirSideMeta,
  DividerSideMeta,
  FileSideMeta,
  MetaJson,
  NavJson,
  SectionHeaderMeta,
  SideMeta,
  SideMetaItem,
} from './node/auto-nav-sidebar/type';
export { PluginDriver } from './node/PluginDriver';
export { RouteService } from './node/route/RouteService';
