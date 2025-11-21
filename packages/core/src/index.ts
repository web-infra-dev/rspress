// TODO: do not expose so much pubic API

export type {
  EditLink,
  Feature,
  FrontMatterMeta,
  Header,
  Hero,
  I18nText,
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
export { matchPath } from 'react-router-dom';
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
