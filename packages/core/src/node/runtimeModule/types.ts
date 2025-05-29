import type { TransformHandler } from '@rsbuild/core';
import type { UserConfig } from '@rspress/shared';
import type { PluginDriver } from '../PluginDriver';
import type { RouteService } from '../route/RouteService';

export interface FactoryContext {
  userDocRoot: string;
  config: UserConfig;
  alias: Record<string, string | string[]>;
  routeService: RouteService;
  pluginDriver: PluginDriver;
}

export type VirtualModulePlugin = (
  context: Omit<FactoryContext, 'alias'>,
) => Record<string, TransformHandler>;

export enum RuntimeModuleID {
  GlobalStyles = 'virtual-global-styles',
  GlobalComponents = 'virtual-global-components',
  Routes = 'virtual-routes',
  SiteData = 'virtual-site-data',
  SearchIndexHash = 'virtual-search-index-hash',
  I18nText = 'virtual-i18n-text',
  SearchHooks = 'virtual-search-hooks',
}
