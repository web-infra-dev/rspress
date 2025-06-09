import type { FrontMatterMeta, UserConfig } from '@rspress/shared';

import type { PluginDriver } from '../PluginDriver';
import type { RouteService } from '../route/RouteService';
import type { TocItem } from './remarkPlugins/toc';

export interface MdxLoaderOptions {
  config: UserConfig;
  docDirectory: string;
  checkDeadLinks: boolean;
  routeService: RouteService;
  pluginDriver: PluginDriver;
}

export interface PageMeta {
  toc: TocItem[];
  title: string;
  headingTitle: string;
  frontmatter?: FrontMatterMeta;
}
