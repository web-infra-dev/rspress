// TODO: do not expose remarkPluginNormalizeLink as publicAPI
export { dev, build, serve, remarkPluginNormalizeLink } from './node';
export * from '@rspress/shared';
export { mergeDocConfig } from '@rspress/shared/node-utils';
export type { RouteService } from './node/route/RouteService';
