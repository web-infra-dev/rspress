// TODO: do not expose remarkPluginNormalizeLink as publicAPI
export {
  dev,
  build,
  serve,
  remarkPluginNormalizeLink,
  remarkFileCodeBlock,
} from './node';

// TODO: do not expose so much pubic API
export type {
  RspressPlugin,
  UserConfig,
  Nav,
  PageIndexInfo,
  RouteMeta,
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  NavItemWithLink,
  SidebarSectionHeader,
} from '@rspress/shared';
export {
  normalizePosixPath,
  getSidebarDataGroup,
  RSPRESS_TEMP_DIR,
  normalizeHref,
  withBase,
  removeTrailingSlash,
} from '@rspress/shared';
export { getNodeAttribute, getIconUrlPath } from '@rspress/shared/node-utils';

export { logger } from '@rspress/shared/logger';

export { mergeDocConfig } from '@rspress/shared/node-utils';
export type { RouteService } from './node/route/RouteService';
