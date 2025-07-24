export { matchPath } from '@rspress/runtime/server';

// TODO: do not expose so much pubic API
export type {
  Nav,
  NavItemWithLink,
  PageIndexInfo,
  RouteMeta,
  RspressPlugin,
  Sidebar,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarSectionHeader,
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
// TODO: do not expose remarkPluginNormalizeLink as publicAPI
export {
  build,
  dev,
  remarkFileCodeBlock,
  remarkPluginNormalizeLink,
  serve,
} from './node';
export type { RouteService } from './node/route/RouteService';
